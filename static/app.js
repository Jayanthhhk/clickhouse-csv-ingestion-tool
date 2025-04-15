function connectClickHouse() {
  const host = document.getElementById("host").value;
  const port = document.getElementById("port").value;
  const user = document.getElementById("user").value;
  const jwt = document.getElementById("jwt").value;

  const status = document.getElementById("status");
  status.innerHTML = "⏳ Connecting to ClickHouse...";

  fetch("/connect_clickhouse", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ host, port, user, jwt })
  })
    .then(res => res.json())
    .then(data => {
      if (data.status === "success") {
        status.innerHTML = `<span style="color: green;">✅ Connected! Databases: ${data.databases.join(", ")}</span>`;
        
        // ✅ NEW: Load JOIN tables right after connecting
        loadJoinTables(); 
      } else {
        status.innerHTML = `<span style="color: red;">❌ Error: ${data.message}</span>`;
      }
    });
}


function listTables() {
  const host = document.getElementById("host").value;
  const port = document.getElementById("port").value;
  const user = document.getElementById("user").value;
  const jwt = document.getElementById("jwt").value;
  const database = document.getElementById("database").value || "default";
  const tableList = document.getElementById("tableList");
  const status = document.getElementById("status");

  status.innerHTML = "⏳ Fetching tables...";

  fetch("/get_tables", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ host, port, user, jwt, database })
  })
    .then(res => res.json())
    .then(data => {
      if (data.status === "success") {
        tableList.innerHTML = "";
        data.tables.forEach(table => {
          const option = document.createElement("option");
          option.value = table;
          option.textContent = table;
          tableList.appendChild(option);
        });
        status.innerHTML = "✅ Tables loaded.";
        loadColumns();
      } else {
        status.innerHTML = `❌ Error: ${data.message}`;
      }
    });
}

function loadColumns() {
  const host = document.getElementById("host").value;
  const port = document.getElementById("port").value;
  const user = document.getElementById("user").value;
  const jwt = document.getElementById("jwt").value;
  const table = document.getElementById("tableList").value;
  const database = document.getElementById("database").value || "default";
  const container = document.getElementById("columnsContainer");
  const status = document.getElementById("status");

  status.innerHTML = "⏳ Loading columns...";

  fetch("/get_columns", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ host, port, user, jwt, table, database })
  })
    .then(res => res.json())
    .then(data => {
      container.innerHTML = "";
      if (data.status === "success") {
        data.columns.forEach(col => {
          const label = document.createElement("label");
          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.value = col;
          checkbox.checked = true;
          label.appendChild(checkbox);
          label.append(` ${col}`);
          container.appendChild(label);
          container.appendChild(document.createElement("br"));
        });
        status.innerHTML = "✅ Columns loaded.";
      } else {
        status.innerHTML = `❌ Error: ${data.message}`;
      }
    });
}

function startIngestion() {
  const direction = document.getElementById("direction").value;
  const host = document.getElementById("host").value;
  const port = document.getElementById("port").value;
  const user = document.getElementById("user").value;
  const jwt = document.getElementById("jwt").value;

  const result = document.getElementById("result");
  const status = document.getElementById("status");

  if (direction === "clickhouse_to_csv") {
    const table = document.getElementById("tableList").value;
    const checkboxes = document.querySelectorAll('#columnsContainer input[type=checkbox]');
    const selectedColumns = Array.from(checkboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.value);
    const columns = selectedColumns.length ? selectedColumns.join(",") : "*";

    status.innerHTML = "⏳ Fetching data from ClickHouse...";

    fetch("/ingest_clickhouse_to_csv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ host, port, user, jwt, table, columns })
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === "success") {
          result.innerHTML = `<span style="color:green;">✅ Exported ${data.records} records to <code>${data.file}</code></span>`;
          status.innerHTML = "✅ Export completed.";
        } else {
          result.innerHTML = `<span style="color:red;">❌ Error: ${data.message}</span>`;
          status.innerHTML = "❌ Export failed.";
        }
      });
  } else {
    result.innerHTML = `<span>CSV to ClickHouse ingestion not implemented yet.</span>`;
    status.innerHTML = "";
  }
}

function uploadCSV() {
  const host = document.getElementById("host").value;
  const port = document.getElementById("port").value;
  const user = document.getElementById("user").value;
  const jwt = document.getElementById("jwt").value;
  const tableName = document.getElementById("clickhouse_table_name").value;
  const fileInput = document.getElementById("csvFile");

  const result = document.getElementById("result");
  const status = document.getElementById("status");

  if (!fileInput.files.length) {
    result.innerHTML = "❌ Please choose a CSV file first.";
    status.innerHTML = "";
    return;
  }

  status.innerHTML = "⏳ Uploading CSV and inserting into ClickHouse...";

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);
  formData.append("host", host);
  formData.append("port", port);
  formData.append("user", user);
  formData.append("jwt", jwt);
  formData.append("table", tableName);

  fetch("/upload_csv_to_clickhouse", {
    method: "POST",
    body: formData
  })
    .then(res => res.json())
    .then(data => {
      if (data.status === "success") {
        result.innerHTML = `✅ Uploaded and inserted ${data.records} records into <code>${data.table}</code>`;
        status.innerHTML = "✅ Upload and insertion completed.";
      } else {
        result.innerHTML = `❌ Error: ${data.message}`;
        status.innerHTML = "❌ Upload failed.";
      }
    });
}

function performJoin() {
  const host = document.getElementById("host").value;
  const port = document.getElementById("port").value;
  const user = document.getElementById("user").value;
  const jwt = document.getElementById("jwt").value;

  const table1 = document.getElementById("join_table1").value;
  const table2 = document.getElementById("join_table2").value;
  const join_column1 = document.getElementById("join_column1").value;
  const join_column2 = document.getElementById("join_column2").value;
  const columns = document.getElementById("join_columns").value || '*';
  const join_type = document.getElementById("join_type").value;

  const result = document.getElementById("result");
  const status = document.getElementById("status");

  status.innerHTML = "⏳ Performing JOIN and exporting to CSV...";

  fetch("/join_tables", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      host, port, user, jwt,
      table1, table2,
      join_column1, join_column2,
      columns, join_type
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.status === "success") {
        result.innerHTML = `<span style="color:green;">✅ JOIN successful! Exported ${data.records} records to <code>${data.file}</code></span>`;
        status.innerHTML = "✅ JOIN completed.";
      } else {
        result.innerHTML = `<span style="color:red;">❌ Error: ${data.message}</span>`;
        status.innerHTML = "❌ JOIN failed.";
      }
    });
}

function loadJoinTables() {
  const host = document.getElementById("host").value;
  const port = document.getElementById("port").value;
  const user = document.getElementById("user").value;
  const jwt = document.getElementById("jwt").value;
  const database = document.getElementById("database").value || "default";

  const status = document.getElementById("status");

  fetch("/get_tables", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ host, port, user, jwt, database })
  })
    .then(res => res.json())
    .then(data => {
      if (data.status === "success") {
        ["join_table1", "join_table2"].forEach(id => {
          const select = document.getElementById(id);
          select.innerHTML = "";
          data.tables.forEach(table => {
            const opt = document.createElement("option");
            opt.value = table;
            opt.textContent = table;
            select.appendChild(opt);
          });
        });
        loadJoinColumns(1);
        loadJoinColumns(2);
      } else {
        status.innerHTML = `❌ Error loading join tables: ${data.message}`;
      }
    });
}

function loadJoinColumns(index) {
  const table = document.getElementById(`join_table${index}`).value;
  const host = document.getElementById("host").value;
  const port = document.getElementById("port").value;
  const user = document.getElementById("user").value;
  const jwt = document.getElementById("jwt").value;
  const database = document.getElementById("database").value || "default";

  fetch("/get_columns", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ host, port, user, jwt, table, database })
  })
    .then(res => res.json())
    .then(data => {
      if (data.status === "success") {
        const columnSelect = document.getElementById(`join_column${index}`);
        columnSelect.innerHTML = "";
        data.columns.forEach(col => {
          const opt = document.createElement("option");
          opt.value = col;
          opt.textContent = col;
          columnSelect.appendChild(opt);
        });
      }
    });
}

