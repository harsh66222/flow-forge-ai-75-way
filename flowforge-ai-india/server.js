const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "assessments.json");

const TYPES = {
  finance: { label: "GST & invoicing", tools: ["GST invoice capture", "Approval workflow", "Tally / ERP connector"], base: 18 },
  support: { label: "Customer support", tools: ["WhatsApp intake", "Knowledge assistant", "Ticket router"], base: 22 },
  hr: { label: "HR & onboarding", tools: ["Employee forms", "Document generator", "HRMS connector"], base: 16 },
  sales: { label: "Sales operations", tools: ["Lead capture", "CRM workflow", "WhatsApp follow-up"], base: 20 },
  inventory: { label: "Inventory & operations", tools: ["Stock threshold monitor", "Reorder alerts", "ERP connector"], base: 19 },
  other: { label: "General operations", tools: ["Workflow orchestrator", "Data connector", "Rules engine"], base: 15 }
};

async function readAssessments() {
  try { return JSON.parse(await fs.readFile(DATA_FILE, "utf8")); }
  catch (error) { if (error.code === "ENOENT") return []; throw error; }
}

async function writeAssessments(items) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(items, null, 2));
}

function analyze(input) {
  const type = TYPES[input.processType] || TYPES.other;
  const frequency = Number(input.frequency);
  const minutes = Number(input.minutesPerRun);
  const people = Number(input.people);
  const hourlyCost = Number(input.hourlyCost);
  const ruleScore = input.ruleBased === "yes" ? 22 : input.ruleBased === "partly" ? 14 : 5;
  const digitalScore = input.digitalInput === "yes" ? 20 : input.digitalInput === "partly" ? 12 : 4;
  const exceptionPenalty = Number(input.exceptionRate) * 0.28;
  const volumeScore = Math.min(22, Math.round(Math.log2(Math.max(frequency, 1) + 1) * 4));
  const score = Math.max(18, Math.min(96, Math.round(type.base + ruleScore + digitalScore + volumeScore - exceptionPenalty)));
  const automationRate = Math.max(0.2, Math.min(0.85, (score / 100) * (1 - Number(input.exceptionRate) / 180)));
  const hours = frequency * minutes * people / 60;
  const savedHours = Math.round(hours * automationRate * 10) / 10;
  const monthlySavings = Math.round(savedHours * hourlyCost);
  const buildCost = Math.max(15000, Math.round((30000 + Number(input.systems) * 9000 + Number(input.exceptionRate) * 250) / 1000) * 1000);
  const payback = monthlySavings ? Math.max(1, Math.round(buildCost / monthlySavings * 10) / 10) : null;
  const risk = Number(input.systems) >= 5 || Number(input.exceptionRate) > 35 ? "High" : Number(input.systems) >= 3 || Number(input.exceptionRate) > 18 ? "Medium" : "Low";
  const level = score >= 75 ? "Strong candidate" : score >= 52 ? "Good with human review" : "Simplify before automating";
  return {
    score, level, savedHours, monthlySavings, buildCost, payback, risk, currency: "INR",
    processLabel: type.label,
    tools: type.tools,
    summary: score >= 75
      ? "Automate the repetitive path and route exceptions to a human reviewer."
      : score >= 52
        ? "Start with assisted automation while standardizing inputs and decision rules."
        : "Document and simplify the process before investing in full automation.",
    roadmap: [
      { week: "Week 1", title: "Map and baseline", detail: "Confirm inputs, owners, exceptions, and current cycle time." },
      { week: "Week 2", title: "Build the pilot", detail: `Connect the first data source and automate the most common ${type.label} workflow.` },
      { week: "Week 3", title: "Test with humans", detail: "Run parallel tests, measure accuracy, and add exception guardrails." },
      { week: "Week 4", title: "Launch and monitor", detail: "Release to a small team and track time saved, errors, and adoption." }
    ]
  };
}

function json(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(body));
}

async function body(req) {
  let value = "";
  for await (const chunk of req) {
    value += chunk;
    if (value.length > 100_000) throw new Error("Request too large");
  }
  return JSON.parse(value || "{}");
}

async function serveStatic(req, res) {
  const pathname = new URL(req.url, "http://localhost").pathname;
  const requested = pathname === "/" ? "index.html" : pathname.slice(1);
  const resolved = path.resolve(PUBLIC_DIR, requested);
  if (!resolved.startsWith(PUBLIC_DIR)) return false;
  try {
    const file = await fs.readFile(resolved);
    const ext = path.extname(resolved);
    const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml" };
    res.writeHead(200, { "Content-Type": `${types[ext] || "application/octet-stream"}; charset=utf-8` });
    res.end(file);
    return true;
  } catch (error) { return error.code !== "ENOENT"; }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    if (req.method === "GET" && url.pathname === "/api/health") return json(res, 200, { status: "ok" });
    if (req.method === "GET" && url.pathname === "/api/assessments") {
      const items = await readAssessments();
      return json(res, 200, items.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10));
    }
    if (req.method === "POST" && url.pathname === "/api/assessments") {
      const input = await body(req);
      const required = ["name", "processType", "frequency", "minutesPerRun", "people", "hourlyCost", "systems", "exceptionRate"];
      if (required.some(key => input[key] === "" || input[key] == null)) return json(res, 400, { error: "Please complete every required field." });
      const item = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), input, result: analyze(input) };
      const items = await readAssessments();
      items.push(item);
      await writeAssessments(items.slice(-100));
      return json(res, 201, item);
    }
    if (req.method === "DELETE" && url.pathname.startsWith("/api/assessments/")) {
      const id = url.pathname.split("/").pop();
      const items = await readAssessments();
      await writeAssessments(items.filter(item => item.id !== id));
      return json(res, 200, { deleted: true });
    }
    if (await serveStatic(req, res)) return;
    json(res, 404, { error: "Not found" });
  } catch (error) {
    json(res, error.message === "Request too large" ? 413 : 500, { error: "Something went wrong." });
  }
});

if (require.main === module) server.listen(PORT, () => console.log(`FlowForge AI is running at http://localhost:${PORT}`));

module.exports = { analyze, server };
