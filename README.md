# 🔄 ClickHouse ↔ Flat File Ingestion Tool

A lightweight, secure, and fully interactive data ingestion platform to transfer data between ClickHouse and CSV files — built as part of the **Software Engineer Intern assignment at Zeotap**.

![UI Screenshot](static/screenshot.png)

---

## 📌 Features

- 🔐 **JWT-authenticated** ClickHouse connection
- 📤 **Export** data from ClickHouse tables to CSV
- 📥 **Ingest** CSV files into ClickHouse with automatic schema detection
- 🧩 **Multi-table JOINs** with selectable columns and join type
- ✅ Table + column discovery with checkboxes
- 📊 Real-time status, record counts, and error feedback
- 🖼️ Clean UI with dropdowns and file upload support

---

## ⚙️ Technologies Used

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Python, Flask
- **Database:** ClickHouse (via `clickhouse-connect`)
- **Data:** CSV (flat files)
- **Extras:** pandas, dotenv, werkzeug

---

## 🚀 Quick Start

```bash
git clone https://github.com/Jayanthhhk/clickhouse-csv-ingestion-tool.git
cd clickhouse-csv-ingestion-tool
python -m venv venv
venv\Scripts\activate         # On Windows
pip install -r requirements.txt
python app.py

docker run -d --name clickhouse-server \
  -p 8123:8123 -e CLICKHOUSE_PASSWORD=mysecret \
  clickhouse/clickhouse-server

data-ingestion-tool/
├── app.py
├── requirements.txt
├── README.md
├── prompts.txt
├── create_test_data.py
├── templates/
│   └── index.html
├── static/
│   ├── app.js
│   ├── style.css
│   └── screenshot.png
├── uploads/
└── clickhouse_output.csv, clickhouse_join_output.csv (optional)

python create_test_data.py
