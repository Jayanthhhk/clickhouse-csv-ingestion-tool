import pandas as pd
from datetime import datetime
from clickhouse_connect import get_client

client = get_client(
    host='localhost',
    port=8123,
    username='default',
    password='mysecret',
    interface='http',
    secure=False
)

# Load CSV
df = pd.read_csv('uk_price_paid.csv')

# ✅ Convert 'transfer_date' column to datetime.date
df['transfer_date'] = pd.to_datetime(df['transfer_date']).dt.date

# Insert into ClickHouse
client.insert_df('uk_price_paid', df)

print("✅ CSV data inserted into 'uk_price_paid'")
