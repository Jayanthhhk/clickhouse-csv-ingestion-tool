from clickhouse_connect import get_client
import pandas as pd

client = get_client(
    host='localhost',
    port=8123,
    username='default',
    password='mysecret',
    interface='http',
    secure=False
)

# Users table
client.command("""
CREATE TABLE IF NOT EXISTS users (
    user_id UInt32,
    name String
) ENGINE = MergeTree()
ORDER BY user_id
""")
client.insert_df('users', pd.DataFrame([
    {'user_id': 1, 'name': 'Alice'},
    {'user_id': 2, 'name': 'Bob'},
    {'user_id': 3, 'name': 'Charlie'},
]))

# Orders table
client.command("""
CREATE TABLE IF NOT EXISTS orders (
    order_id UInt32,
    user_id UInt32,
    amount Float32
) ENGINE = MergeTree()
ORDER BY order_id
""")
client.insert_df('orders', pd.DataFrame([
    {'order_id': 101, 'user_id': 1, 'amount': 50.5},
    {'order_id': 102, 'user_id': 2, 'amount': 75.0},
    {'order_id': 103, 'user_id': 4, 'amount': 20.0},
]))
