// 🔐 Handle Logout
function logout() {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("userName");
  alert("You have been logged out.");
  window.location.href = "login.html";
}

// ✅ Get and Save Transactions
function getTransactions() {
  return JSON.parse(localStorage.getItem("budgetTransactions")) || [];
}

function saveTransactions(transactions) {
  localStorage.setItem("budgetTransactions", JSON.stringify(transactions));
}

// ✅ Show/hide category selector based on type
const typeSelect = document.getElementById("txn-type");
const categorySection = document.getElementById("category-section");

if (typeSelect && categorySection) {
  typeSelect.addEventListener("change", () => {
    categorySection.style.display = (typeSelect.value === "Expense") ? "block" : "none";
  });
}

// ====== Budget Allocation from Monthly Budget ====== //
function getCategoryLimitsFromBudget() {
  const totalBudget = parseFloat(localStorage.getItem("totalMonthlyBudget")) || 0;
  return {
    Groceries: Math.round(totalBudget * 0.35),
    Utilities: Math.round(totalBudget * 0.25),
    Entertainment: Math.round(totalBudget * 0.25),
    Transport: Math.round(totalBudget * 0.15)
  };
}

function calculateBudget() {
  const transactions = getTransactions();
  const categoryLimits = getCategoryLimitsFromBudget();
  const totals = {
    Groceries: 0,
    Utilities: 0,
    Entertainment: 0,
    Transport: 0
  };

  let totalSpent = 0;
  let totalBudget = Object.values(categoryLimits).reduce((sum, val) => sum + val, 0);

  transactions.forEach(txn => {
    if (txn.type === "Expense" && totals.hasOwnProperty(txn.category)) {
      totals[txn.category] += txn.amount;
      totalSpent += txn.amount;
    }
  });

  return { totals, totalSpent, totalBudget, categoryLimits };
}

function updateBudgetUI() {
  const { totals, totalSpent, totalBudget, categoryLimits } = calculateBudget();
  const percentUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const circle = document.getElementById("circular-progress");
  if (circle) {
    circle.style.strokeDashoffset = `${440 - (440 * percentUsed) / 100}`;
  }

  const percentText = document.getElementById("budget-percentage");
  if (percentText) {
    percentText.textContent = `${Math.round(percentUsed)}%`;
  }

  const bar = document.getElementById("total-progress-bar");
  if (bar) {
    bar.style.width = `${percentUsed}%`;
  }

  document.getElementById("spent-text").textContent = `Spent: ₹${totalSpent}`;
  document.getElementById("total-budget-text").textContent = `Total: ₹${totalBudget}`;
  document.getElementById("remaining-budget-text").textContent = `₹${totalBudget - totalSpent}`;

  Object.keys(totals).forEach(cat => {
    const el = document.getElementById(`${cat.toLowerCase()}-text`);
    if (el) {
      el.textContent = `₹${totals[cat]} / ₹${categoryLimits[cat]}`;
    }
  });

  // ✅ Simple 50% budget alert
  if (totalBudget > 0 && totalSpent > totalBudget * 0.5) {
    alert("⚠️ Alert: You have spent more than 50% of your monthly budget!");
  }
}


// ====== Form Submit Handling ====== //
document.getElementById("addTransactionForm")?.addEventListener("submit", function (e) {
  e.preventDefault();

  const title = document.getElementById("txn-title").value.trim();
  const amount = parseFloat(document.getElementById("txn-amount").value);
  const type = document.getElementById("txn-type").value;
  const date = document.getElementById("txn-date").value;
  const category = type === "Expense" ? document.getElementById("txn-category").value : type;

  if (!title || isNaN(amount) || !date) {
    alert("Please fill all fields correctly");
    return;
  }

  const txn = { title, amount, type, category, date };
  const txns = getTransactions();
  txns.push(txn);
  saveTransactions(txns);

  this.reset();
  document.getElementById("category-section").style.display = "none";
  updateBudgetUI();
  renderRecentTransactions();
  updateGraphCard();
  renderLineChart();
});

// ====== Delete Transaction ====== //
document.getElementById("deleteBtn")?.addEventListener("click", function () {
  const deleteTitle = document.getElementById("delete-title").value.trim();
  if (!deleteTitle) {
    alert("Enter title to delete");
    return;
  }

  const transactions = getTransactions();
  const filtered = transactions.filter(txn => txn.title.toLowerCase() !== deleteTitle.toLowerCase());

  if (filtered.length === transactions.length) {
    alert("No matching transaction found");
    return;
  }

  saveTransactions(filtered);
  alert("Transaction deleted!");
  document.getElementById("delete-title").value = "";
  updateBudgetUI();
  renderRecentTransactions();
  updateGraphCard();
  renderLineChart();
});

// ====== Budget Save ====== //
function saveMonthlyBudget() {
  const input = document.getElementById("monthlyBudgetInput");
  const value = parseFloat(input.value);

  if (isNaN(value) || value <= 0) {
    alert("Please enter a valid budget amount.");
    return;
  }

  localStorage.setItem("totalMonthlyBudget", value);
  document.getElementById("monthly-budget-card").style.display = "none";
  location.reload();

  window.location.href = "index.html";
}

// ====== Report Download ====== //
function downloadBudgetReport() {
  const txns = getTransactions();
  if (txns.length === 0) {
    alert("No transactions to export.");
    return;
  }

  const csvHeader = "Title,Amount,Type,Category,Date\n";
  const csvRows = txns.map(txn => `${txn.title},${txn.amount},${txn.type},${txn.category},${txn.date}`);
  const blob = new Blob([csvHeader + csvRows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "Expenza_Budget_Report.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ====== Graph Card Update ====== //
function updateGraphCard() {
  const txns = getTransactions();
  const clicks = txns.length;
  const expenseTxns = txns.filter(t => t.type === "Expense");
  const totalExpense = expenseTxns.reduce((sum, t) => sum + t.amount, 0);
  const cpc = expenseTxns.length ? (totalExpense / expenseTxns.length).toFixed(2) : "0.00";

  document.querySelector(".graph-clicks").textContent = `${clicks}`;
  document.querySelector(".graph-cpc").textContent = `₹${cpc}`;
}

// ====== Line Chart (Last 7 Days) ====== //
function renderLineChart() {
  const ctx = document.getElementById("lineChart").getContext("2d");
  const txns = getTransactions();

  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });

  const labels = last7Days.map(date =>
    new Date(date).toLocaleDateString("en-IN", { weekday: "short" })
  );

  const dataPoints = last7Days.map(date => {
    return txns.filter(t => t.type === "Expense" && t.date === date)
               .reduce((sum, t) => sum + t.amount, 0);
  });

  if (window.myLineChart) {
    window.myLineChart.destroy();
  }

  window.myLineChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Daily Expenses",
        data: dataPoints,
        fill: true,
        backgroundColor: "rgba(217, 119, 122, 0.2)",
        borderColor: "#D9777A",
        tension: 0.4,
        pointBackgroundColor: "#C45552"
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          ticks: { color: "#7C6F64" },
          grid: { color: "#EDE9D5" }
        },
        y: {
          ticks: { color: "#7C6F64" },
          grid: { color: "#EDE9D5" }
        }
      }
    }
  });
}

// ====== Render Recent Transactions ====== //
function renderRecentTransactions() {
  const transactions = getTransactions();
  const list = document.getElementById("transactionList");
  if (!list) return;
  list.innerHTML = "";
  const recent = transactions.slice(-5).reverse();

  recent.forEach((txn) => {
    const li = document.createElement("li");
    li.className = "py-3 flex justify-between items-center";

    let color = "#1C1C1C";
    if (txn.type === "Expense") color = "#C45552";
    else if (txn.type === "Income") color = "#CBA135";
    else if (txn.type === "Savings") color = "#E6A57E";

    li.innerHTML = `
      <div>
        <p class="font-medium">${txn.title}</p>
        <p class="text-xs text-[#7C6F64]">${new Date(txn.date).toLocaleDateString()}</p>
      </div>
      <span class="font-semibold" style="color:${color}">
        ${txn.type === "Expense" ? "-" : "+"} ₹${txn.amount}
      </span>
    `;
    list.appendChild(li);
  });
}

// ====== On DOM Load ====== //
document.addEventListener("DOMContentLoaded", () => {
  updateBudgetUI();
  updateGraphCard();
  renderLineChart();
  renderRecentTransactions();

  // Always show the budget form
  const budgetCard = document.getElementById("monthly-budget-card");
  if (budgetCard) budgetCard.style.display = "block";
});
