from flask import Flask, render_template, request, jsonify
from clickhouse_connect import get_client
from werkzeug.utils import secure_filename
import pandas as pd
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/connect_clickhouse', methods=['POST'])
def connect_clickhouse():
    data = request.json
    try:
        client = get_client(
            host=data['host'],
            port=int(data['port']),
            username=data['user'],
            password=data['jwt'],
            interface='http',
            secure=False
        )
        databases = client.query("SHOW DATABASES").result_rows
        return jsonify({"status": "success", "databases": [db[0] for db in databases]})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

@app.route('/ingest_clickhouse_to_csv', methods=['POST'])
def ingest_clickhouse_to_csv():
    data = request.json
    try:
        client = get_client(
            host=data['host'],
            port=int(data['port']),
            username=data['user'],
            password=data['jwt'],
            interface='http',
            secure=False
        )

        table = data['table']
        columns = data.get('columns', '*')
        query = f"SELECT {columns} FROM {table}"

        result = client.query(query)
        df = pd.DataFrame(result.result_rows, columns=result.column_names)

        output_file = 'clickhouse_output.csv'
        df.to_csv(output_file, index=False)

        return jsonify({"status": "success", "records": len(df), "file": output_file})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

@app.route('/upload_csv_to_clickhouse', methods=['POST'])
def upload_csv_to_clickhouse():
    try:
        file = request.files['file']
        host = request.form['host']
        port = int(request.form['port'])
        user = request.form['user']
        jwt = request.form['jwt']
        table = request.form['table']

        client = get_client(
            host=host,
            port=port,
            username=user,
            password=jwt,
            interface='http',
            secure=False
        )

        filename = secure_filename(file.filename)
        filepath = os.path.join('uploads', filename)
        os.makedirs('uploads', exist_ok=True)
        file.save(filepath)

        df = pd.read_csv(filepath)

        if 'transfer_date' in df.columns:
            df['transfer_date'] = pd.to_datetime(df['transfer_date']).dt.date

        sample_row = df.iloc[0]
        columns_sql = []
        for col in df.columns:
            dtype = 'UInt32' if pd.api.types.is_integer_dtype(df[col]) else 'String'
            if 'date' in col.lower():
                dtype = 'Date'
            columns_sql.append(f"{col} {dtype}")
        schema_sql = ',\n  '.join(columns_sql)

        create_sql = f"""
        CREATE TABLE IF NOT EXISTS {table} (
            {schema_sql}
        ) ENGINE = MergeTree()
        ORDER BY tuple()
        """

        client.command(create_sql)
        client.insert_df(table, df)

        return jsonify({"status": "success", "records": len(df), "table": table})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

@app.route('/get_tables', methods=['POST'])
def get_tables():
    try:
        data = request.json
        client = get_client(
            host=data['host'],
            port=int(data['port']),
            username=data['user'],
            password=data['jwt'],
            interface='http',
            secure=False
        )
        db = data.get('database', 'default')
        result = client.query(f"SHOW TABLES FROM {db}")
        tables = [row[0] for row in result.result_rows]
        return jsonify({"status": "success", "tables": tables})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

@app.route('/get_columns', methods=['POST'])
def get_columns():
    try:
        data = request.json
        client = get_client(
            host=data['host'],
            port=int(data['port']),
            username=data['user'],
            password=data['jwt'],
            interface='http',
            secure=False
        )
        table = data['table']
        db = data.get('database', 'default')
        result = client.query(f"DESCRIBE TABLE {db}.{table}")
        columns = [row[0] for row in result.result_rows]
        return jsonify({"status": "success", "columns": columns})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})
@app.route('/join_tables', methods=['POST'])
def join_tables():
    try:
        data = request.json
        client = get_client(
            host=data['host'],
            port=int(data['port']),
            username=data['user'],
            password=data['jwt'],
            interface='http',
            secure=False
        )

        table1 = data['table1']
        table2 = data['table2']
        join_column1 = data['join_column1']
        join_column2 = data['join_column2']
        columns = data.get('columns', '*')  # Optional: "t1.colA, t2.colB"
        join_type = data.get('join_type', 'INNER')  # INNER / LEFT / RIGHT / FULL

        query = f"""
        SELECT {columns}
        FROM {table1} AS t1
        {join_type} JOIN {table2} AS t2
        ON t1.{join_column1} = t2.{join_column2}
        """

        result = client.query(query)
        df = pd.DataFrame(result.result_rows, columns=result.column_names)
        output_file = 'clickhouse_join_output.csv'
        df.to_csv(output_file, index=False)

        return jsonify({"status": "success", "records": len(df), "file": output_file})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

    

if __name__ == '__main__':
    app.run(debug=True)
