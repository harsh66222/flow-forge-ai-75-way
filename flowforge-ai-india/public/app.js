const form = document.querySelector("#assessmentForm");
const results = document.querySelector("#results");
const emptyState = document.querySelector("#emptyState");
const history = document.querySelector("#history");
const errorBox = document.querySelector("#formError");
const submitButton = form.querySelector("button[type='submit']");

document.querySelector("#exceptionRate").addEventListener("input", event => {
  document.querySelector("#exceptionOutput").textContent = `${event.target.value}%`;
});

document.querySelector("#themeButton").addEventListener("click", () => document.body.classList.toggle("dark"));
document.querySelector("#refreshButton").addEventListener("click", loadHistory);

function money(value, currency = "INR") { return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(value); }
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]); }

function renderResult(item) {
  const r = item.result;
  const currency = r.currency || "USD";
  emptyState.hidden = true;
  results.hidden = false;
  results.innerHTML = `
    <div class="score-head"><div><h2>${escapeHtml(r.level)}</h2><p>${escapeHtml(r.processLabel)}</p></div><div class="score-number">${r.score}<small>/100</small></div></div>
    <p class="verdict">${escapeHtml(r.summary)}</p>
    <div class="savings-chart" role="img" aria-label="Estimated monthly savings: ${money(r.monthlySavings, currency)}. Estimated annual savings: ${money(r.monthlySavings * 12, currency)}."><div class="chart-head"><span>POTENTIAL SAVINGS</span><strong>${money(r.monthlySavings * 12, currency)} <small>per year</small></strong></div><div class="chart-columns"><div><i style="--bar-height:12%"></i><span>1 month</span></div><div><i style="--bar-height:52%"></i><span>6 months</span></div><div><i style="--bar-height:100%"></i><span>12 months</span></div></div></div>
    <div class="metrics">
      <div class="metric"><span>HOURS SAVED / MONTH</span><b>${r.savedHours}</b></div>
      <div class="metric"><span>EST. MONTHLY VALUE</span><b>${money(r.monthlySavings, currency)}</b></div>
      <div class="metric"><span>EST. PILOT COST</span><b>${money(r.buildCost, currency)}</b></div>
      <div class="metric"><span>PAYBACK · RISK</span><b>${r.payback ? `${r.payback} mo` : "N/A"} · ${r.risk}</b></div>
    </div>
    <div class="tool-stack">${r.tools.map(tool => `<span>${escapeHtml(tool)}</span>`).join("")}</div>
    <div class="roadmap"><h3>30-day rollout</h3>${r.roadmap.map(step => `<div class="roadmap-item"><small>${escapeHtml(step.week)}</small><div><b>${escapeHtml(step.title)}</b><p>${escapeHtml(step.detail)}</p></div></div>`).join("")}</div>`;
  document.querySelector("#resultPanel").scrollIntoView({ behavior: "smooth", block: "nearest" });
}

async function loadHistory() {
  try {
    const response = await fetch("/api/assessments");
    const items = await response.json();
    if (!items.length) { history.innerHTML = '<p class="history-empty">No assessments saved yet.</p>'; return; }
    history.innerHTML = items.map(item => `<article class="history-card" data-id="${item.id}"><header><div><h3>${escapeHtml(item.input.name)}</h3><p class="history-meta">${escapeHtml(item.result.processLabel)} · ${new Date(item.createdAt).toLocaleDateString("en-IN")}</p></div><button type="button" aria-label="Delete ${escapeHtml(item.input.name)}" title="Delete assessment">×</button></header><div class="history-stats"><span>READINESS<b>${item.result.score}/100</b></span><span>MONTHLY VALUE<b>${money(item.result.monthlySavings, item.result.currency || "USD")}</b></span></div></article>`).join("");
    history.querySelectorAll("article").forEach((card, index) => {
      card.addEventListener("click", event => { if (event.target.tagName !== "BUTTON") renderResult(items[index]); });
      card.querySelector("button").addEventListener("click", async () => { await fetch(`/api/assessments/${card.dataset.id}`, { method: "DELETE" }); loadHistory(); });
    });
  } catch { history.innerHTML = '<p class="history-empty">Saved assessments are temporarily unavailable.</p>'; }
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  errorBox.textContent = "";
  submitButton.disabled = true;
  submitButton.querySelector("span").textContent = "Analyzing process...";
  const input = Object.fromEntries(new FormData(form));
  try {
    const response = await fetch("/api/assessments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
    const item = await response.json();
    if (!response.ok) throw new Error(item.error || "Unable to create the plan.");
    renderResult(item);
    await loadHistory();
  } catch (error) { errorBox.textContent = error.message; }
  finally { submitButton.disabled = false; submitButton.querySelector("span").textContent = "Generate automation plan"; }
});

loadHistory();
