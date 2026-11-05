import test from "node:test";
import assert from "node:assert/strict";
import {
  totals,
  decodeStore,
  billSummary,
  validDate,
} from "../src/domain/records.ts";
const line = {
  description: "Brickwork",
  unit: "sqm",
  quantity: "12.125",
  rate: "245.55",
};
test("measured quantities round to paise before applying deductions", () => {
  assert.deepEqual(totals([line], "100.25"), {
    gross: 297729,
    deductions: 10025,
    net: 287704,
  });
  assert.equal(
    totals([{ ...line, quantity: "0.1", rate: "0.20" }], "0").net,
    2,
  );
});
test("rejects invalid measurements and excessive deductions", () => {
  for (const quantity of ["-1", "NaN", "Infinity", "", "1e3", "1.0001", "0"])
    assert.throws(() => totals([{ ...line, quantity }], "0"));
  assert.throws(() => totals([line], "999999"));
  assert.throws(() => totals([{ ...line, rate: "10.123" }], "0"));
});
test("dates reject impossible days and malformed values", () => {
  assert.equal(validDate("2026-02-29"), false);
  assert.equal(validDate("2028-02-29"), true);
  assert.equal(validDate("2026-11-05"), true);
  assert.equal(validDate("5/11/2026"), false);
});
const project = {
  id: "p1",
  name: "Test site",
  client: "Test client",
  location: "",
};
const bill = {
  id: "b1",
  projectId: "p1",
  kind: "Client claim",
  party: "Test client",
  reference: "",
  date: "2026-11-05",
  lines: [line],
  deduction: "100.25",
  notes: "",
  createdAt: "2026-11-05T12:00:00Z",
};
const store = {
  version: 1,
  projects: [project],
  bills: [bill],
  siteRecords: [],
};
test("saved records round-trip and invalid records are rejected", () => {
  assert.deepEqual(decodeStore(JSON.stringify(store)), store);
  assert.throws(() => decodeStore(JSON.stringify({ ...store, version: 2 })));
  assert.throws(() => decodeStore(JSON.stringify({ ...store, projects: [] })));
  assert.throws(() =>
    decodeStore(
      JSON.stringify({ ...store, bills: [{ ...bill, deduction: "-1" }] }),
    ),
  );
  assert.throws(() =>
    decodeStore(JSON.stringify({ ...store, projects: [project, project] })),
  );
  assert.throws(() => decodeStore("{broken"));
});
test("shared summary clearly identifies a draft with no tax calculation", () => {
  const summary = billSummary(bill, project);
  assert.match(summary, /LOCAL DRAFT/);
  assert.match(summary, /Not a tax invoice/);
  assert.match(summary, /Tax has not been calculated/);
  assert.match(summary, /Test site/);
});
