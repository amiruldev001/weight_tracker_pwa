document.getElementById("progressForm").addEventListener("submit", e => {
  e.preventDefault();

  const date = date.value;
  const weight = weight.value;
  const fat = fat.value;
  const water = water.value;
  const notes = notes.value;

  db.run(
    "INSERT INTO progress (date, weight, fat, water, notes) VALUES (?, ?, ?, ?, ?)",
    [date, weight, fat, water, notes]
  );

  saveDb();
  loadRecords();
  e.target.reset();
});

function loadRecords() {
  const list = document.getElementById("recordList");
  list.innerHTML = "";

  const res = db.exec("SELECT * FROM progress ORDER BY date DESC");
  if (!res.length) return;

  res[0].values.forEach(row => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${row[1]}</strong><br>
      Weight: ${row[2]} kg<br>
      Fat: ${row[3] || "-"}% | Water: ${row[4] || "-"}%<br>
      <em>${row[5] || ""}</em>
    `;
    list.appendChild(li);
  });
}
