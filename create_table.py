from clickhouse_connect import get_client

client = get_client(
    host='localhost',
    port=8123,
    username='default',
    password='mysecret',
    interface='http',
    secure=False
)

client.command("""
CREATE TABLE IF NOT EXISTS uk_price_paid (
    postcode String,
    price UInt32,
    transfer_date Date
) ENGINE = MergeTree()
ORDER BY transfer_date
""")

print("✅ Table 'uk_price_paid' created successfully.")
