let db;
let SQL;

const DB_NAME = "fitness.db";

initSqlJs({
  locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
}).then(async SQLLib => {
  SQL = SQLLib;
  const savedDb = localStorage.getItem(DB_NAME);

  db = savedDb
    ? new SQL.Database(Uint8Array.from(atob(savedDb), c => c.charCodeAt(0)))
    : new SQL.Database();

  db.run(`
    CREATE TABLE IF NOT EXISTS progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      weight REAL,
      fat REAL,
      water REAL,
      notes TEXT
    )
  `);

  loadRecords();
});

function saveDb() {
  const data = db.export();
  localStorage.setItem(DB_NAME, btoa(String.fromCharCode(...data)));
}
