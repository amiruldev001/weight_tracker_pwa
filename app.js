// Register Service Worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}

const form = document.getElementById("progressForm");
const recordList = document.getElementById("recordList");

form.addEventListener("submit", function (e) {
  e.preventDefault();

  // Ensure DB is ready
  if (!window.db) {
    alert("Database still loading, please try again.");
    return;
  }

  // Get input values SAFELY
  const dateVal = document.getElementById("date").value;
  const weightVal = document.getElementById("weight").value;
  const fatVal = document.getElementById("fat").value || null;
  const waterVal = document.getElementById("water").value || null;
  const notesVal = document.getElementById("notes").value || "";

  // Insert into SQLite
  db.run(
    `INSERT INTO progress (date, weight, fat, water, notes)
     VALUES (?, ?, ?, ?, ?)`,
    [dateVal, weightVal, fatVal, waterVal, notesVal]
  );

  saveDb();
  loadRecords();
  form.reset();
});

function loadRecords() {
  recordList.innerHTML = "";

  if (!window.db) return;

  const res = db.exec("SELECT * FROM progress ORDER BY date DESC");
  if (!res.length) return;

  res[0].values.forEach(row => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${row[1]}</strong><br>
      Weight: ${row[2]} kg<br>
      Fat: ${row[3] ?? "-"}% | Water: ${row[4] ?? "-"}%<br>
      <em>${row[5]}</em>
    `;
    recordList.appendChild(li);
  });
}
