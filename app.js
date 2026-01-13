// ===========================
// APP.JS - FULL INTEGRATED WITH DB READY
// ===========================

// Register Service Worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}

// ---------------------------
// DOM ELEMENTS
// ---------------------------
const pinOverlay = document.getElementById("pinOverlay");
const pinInput = document.getElementById("pinInput");
const pinBtn = document.getElementById("pinBtn");
const pinMsg = document.getElementById("pinMsg");
const lockBtn = document.getElementById("lockBtn");
const resetBtn = document.getElementById("resetBtn");

const form = document.getElementById("progressForm");
const recordList = document.getElementById("recordList");
const bmiBox = document.getElementById("bmiBox");
const themeToggle = document.getElementById("themeToggle");
const chartCanvas = document.getElementById("weightChart");

let weightChart;

// ---------------------------
// UTILITIES
// ---------------------------
function hashPin(pin) {
  return btoa(pin.split("").reverse().join(""));
}

function calculateBMI(weight, height) {
  if (!height) return null;
  return (weight / (height * height)).toFixed(1);
}

function getTrendArrow(current, previous) {
  if (!previous) return "➖";
  if (current < previous) return "⬇️";
  if (current > previous) return "⬆️";
  return "➖";
}

// ---------------------------
// DARK MODE
// ---------------------------
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
}

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem(
    "theme",
    document.body.classList.contains("dark") ? "dark" : "light"
  );
});

// ---------------------------
// PIN LOCK
// ---------------------------
function checkPin() {
  pinOverlay.style.display = "flex";

  const savedPin = localStorage.getItem("pin");
  if (!savedPin) {
    pinMsg.textContent = "Set a new 4-digit PIN";
    pinBtn.textContent = "Set PIN";
  } else {
    pinMsg.textContent = "Enter your PIN";
    pinBtn.textContent = "Unlock";
  }

  pinBtn.onclick = () => {
    const entered = pinInput.value;
    if (entered.length !== 4) {
      pinMsg.textContent = "PIN must be 4 digits";
      return;
    }

    let savedPin = localStorage.getItem("pin"); // read fresh

    if (!savedPin) {
      localStorage.setItem("pin", hashPin(entered));
      pinOverlay.style.display = "none";
      pinInput.value = "";
      return;
    }

    if (hashPin(entered) === savedPin) {
      pinOverlay.style.display = "none";
      pinInput.value = "";
    } else {
      pinMsg.textContent = "Wrong PIN";
    }
  };
}

lockBtn.addEventListener("click", () => {
  pinInput.value = "";
  pinMsg.textContent = "";
  pinOverlay.style.display = "flex";
});

// ---------------------------
// RESET / CLEAR DATA
// ---------------------------
resetBtn.addEventListener("click", async () => {
  await window.dbReady; // wait for DB
  if (!confirm("This will delete ALL progress data. Continue?")) return;

  db.run("DELETE FROM progress");
  saveDb();

  recordList.innerHTML = "";
  bmiBox.innerHTML = "";
  if (weightChart) weightChart.destroy();

  alert("All data cleared.");
});

// ---------------------------
// FORM SUBMIT
// ---------------------------
form.addEventListener("submit", async function (e) {
  e.preventDefault();
  await window.dbReady; // wait for DB

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

// ---------------------------
// LOAD RECORDS + BMI + TREND
// ---------------------------
async function loadRecords() {
  await window.dbReady;
  recordList.innerHTML = "";

  const res = db.exec("SELECT * FROM progress ORDER BY date ASC");
  if (!res.length) return;

  const labels = [];
  const weights = [];

  res[0].values.forEach(row => {
    labels.push(row[1]);
    weights.push(row[2]);
  });

  renderChart(labels, weights);

  const latest = res[0].values.at(-1);
  const previous = res[0].values.at(-2);
  const height = localStorage.getItem("height");

  if (height && latest) {
    const bmi = calculateBMI(latest[2], height);
    const arrow = getTrendArrow(latest[2], previous?.[2]);
    bmiBox.innerHTML = `<strong>BMI:</strong> ${bmi} ${arrow}`;
  }

  // Display records latest first
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

// ---------------------------
// CHART.JS WEIGHT TREND
// ---------------------------
function renderChart(labels, weights) {
  const ctx = chartCanvas.getContext("2d");
  if (weightChart) weightChart.destroy();

  weightChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Weight (kg)",
          data: weights,
          borderWidth: 3,
          borderColor: "#60a5fa",
          backgroundColor: "rgba(96, 165, 250, 0.2)",
          tension: 0.3,
          fill: true
        }
      ]
    },
    options: { responsive: true, plugins: { legend: { display: false } } }
  });
}

// ---------------------------
// INITIALIZE
// ---------------------------
checkPin();
window.dbReady.then(() => loadRecords());
