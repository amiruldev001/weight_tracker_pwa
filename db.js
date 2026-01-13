let db;
let SQL;
const DB_NAME = "fitness.db";

// A promise that resolves when DB is ready
window.dbReady = initSqlJs({
  // locateFile maps "sql-wasm.wasm" to the correct URL on CDN
  locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js`
}).then(async SQLLib => {
  SQL = SQLLib;

  // Load DB from localStorage if exists
  const savedDb = localStorage.getItem(DB_NAME);

  db = savedDb
    ? new SQL.Database(Uint8Array.from(atob(savedDb), c => c.charCodeAt(0)))
    : new SQL.Database();

  // Create table if not exists
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

  console.log("Database initialized");
  return db; // resolve with DB instance
});

// Save DB to localStorage
function saveDb() {
  if (!db) return;
  const data = db.export();
  localStorage.setItem(DB_NAME, btoa(String.fromCharCode(...data)));
  console.log("Database saved to localStorage");
}
