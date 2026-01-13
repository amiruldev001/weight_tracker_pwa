// Register Service Worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}
const pinOverlay = document.getElementById("pinOverlay");
const pinInput = document.getElementById("pinInput");
const pinBtn = document.getElementById("pinBtn");
const pinMsg = document.getElementById("pinMsg");
const lockBtn = document.getElementById("lockBtn");
const resetBtn = document.getElementById("resetBtn");

function hashPin(pin) {
  return btoa(pin.split("").reverse().join(""));
}

// Cache DOM
const form = document.getElementById("progressForm");
const recordList = document.getElementById("recordList");
const bmiBox = document.getElementById("bmiBox");
const themeToggle = document.getElementById("themeToggle");

let weightChart;

// Dark mode restore
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
}

// Theme toggle
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem(
    "theme",
    document.body.classList.contains("dark") ? "dark" : "light"
  );
});

// Form submit
form.addEventListener("submit", function (e) {
  e.preventDefault();

  if (!window.db) {
    alert("Database still loading, try again.");
    return;
  }

  // SAFE input reads
  const dateVal = document.getElementById("date").value;
  const weightVal = document.getElementById("weight").value;
  const fatVal = document.getElementById("fat").value || null;
  const waterVal = document.getElementById("water").value || null;
  const notesVal = document.getElementById("notes").value || "";
  const heightVal = document.getElementById("height").value;

  if (heightVal) localStorage.setItem("height", heightVal);

  db.run(
    `INSERT INTO progress (date, weight, fat, water, notes)
     VALUES (?, ?, ?, ?, ?)`,
    [dateVal, weightVal, fatVal, waterVal, notesVal]
  );

  saveDb();
  loadRecords();
  form.reset();
});

// Load records
function loadRecords() {
  recordList.innerHTML = "";

  if (!window.db) return;

  const res = db.exec("SELECT * FROM progress ORDER BY date ASC");
  if (!res.length) return;

  const labels = [];
  const weights = [];

  res[0].values.forEach(row => {
    labels.push(row[1]);
    weights.push(row[2]);
  });

  renderChart(labels, weights);

  // BMI + trend
  const latest = res[0].values.at(-1);
  const previous = res[0].values.at(-2);
  const height = localStorage.getItem("height");

  if (height && latest) {
    const bmi = (latest[2] / (height * height)).toFixed(1);
    const arrow =
      !previous ? "➖" :
      latest[2] < previous[2] ? "⬇️" :
      latest[2] > previous[2] ? "⬆️" : "➖";

    bmiBox.innerHTML = `<strong>BMI:</strong> ${bmi} ${arrow}`;
  }

  // Records (latest first)
  res[0].values.slice().reverse().forEach(row => {
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

// Chart
function renderChart(labels, weights) {
  const ctx = document.getElementById("weightChart").getContext("2d");
  if (weightChart) weightChart.destroy();

  weightChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        data: weights,
        borderWidth: 3,
        tension: 0.3
      }]
    },
    options: {
      plugins: { legend: { display: false } }
    }
  });
}

function checkPin() {
  const savedPin = localStorage.getItem("pin");

  if (!savedPin) {
    pinMsg.textContent = "Set a new 4-digit PIN";
    pinBtn.textContent = "Set PIN";
  }

  pinBtn.onclick = () => {
    const entered = pinInput.value;

    if (entered.length !== 4) {
      pinMsg.textContent = "PIN must be 4 digits";
      return;
    }

    if (!savedPin) {
      localStorage.setItem("pin", hashPin(entered));
      pinOverlay.style.display = "none";
      return;
    }

    if (hashPin(entered) === savedPin) {
      pinOverlay.style.display = "none";
    } else {
      pinMsg.textContent = "Wrong PIN";
    }
  };
}

resetBtn.addEventListener("click", () => {
  if (!confirm("This will delete ALL progress data. Continue?")) return;

  db.run("DELETE FROM progress");
  saveDb();

  recordList.innerHTML = "";
  bmiBox.innerHTML = "";

  if (weightChart) weightChart.destroy();

  alert("All data cleared.");
});


lockBtn.addEventListener("click", () => {
  pinInput.value = "";
  pinMsg.textContent = "";
  pinOverlay.style.display = "flex";
});


checkPin();


