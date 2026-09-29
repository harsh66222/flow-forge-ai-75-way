const test = require("node:test");
const assert = require("node:assert/strict");
const { analyze } = require("../server");

test("high-volume digital process receives a strong score and positive ROI", () => {
  const result = analyze({ processType: "finance", frequency: 500, minutesPerRun: 8, people: 2, hourlyCost: 20, systems: 2, exceptionRate: 5, ruleBased: "yes", digitalInput: "yes" });
  assert.ok(result.score >= 75);
  assert.ok(result.monthlySavings > 0);
  assert.equal(result.roadmap.length, 4);
});

test("manual exception-heavy work is scored lower", () => {
  const strong = analyze({ processType: "support", frequency: 300, minutesPerRun: 10, people: 3, hourlyCost: 18, systems: 2, exceptionRate: 5, ruleBased: "yes", digitalInput: "yes" });
  const weak = analyze({ processType: "support", frequency: 10, minutesPerRun: 10, people: 1, hourlyCost: 18, systems: 5, exceptionRate: 70, ruleBased: "no", digitalInput: "no" });
  assert.ok(strong.score > weak.score);
});
