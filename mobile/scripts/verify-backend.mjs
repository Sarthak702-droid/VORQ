// Real, non-posting integration check against the existing local VORQ development site.
// Creates one clearly labelled site report and one DRAFT invoice; never submits or pays.
import { readFile, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "../src/api/client.ts";
const baseUrl = process.env.VORQ_VERIFY_BASE || "http://127.0.0.1:8082";
assert.ok(
  ["127.0.0.1", "localhost"].includes(new URL(baseUrl).hostname),
  "Verification is restricted to the local development stack.",
);
const config = Object.fromEntries(
  (
    await readFile(
      new URL("../../integration-workspace/deployment/.env", import.meta.url),
      "utf8",
    )
  )
    .split("\n")
    .filter((line) => line.includes("="))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1)];
    }),
);
let sid = "";
const client = createClient({
  baseUrl,
  cookie: () => sid,
  onCookie: async (value) => {
    sid = value;
  },
});
const evidence = {};
try {
  await client.request(
    "login",
    { usr: "Administrator", pwd: config.ADMIN_PASSWORD },
    true,
  );
  const session = await client.request("session");
  assert.equal(session.user, "Administrator");
  client.setCsrf(session.csrf_token);
  evidence.login = true;
  const company = "VORQ Development";
  assert.ok(session.companies.includes(company));
  const workspace = await client.request("workspace", { company });
  const project =
    workspace.projects.find((project) =>
      project.project_name.startsWith("Acceptance Site"),
    )?.name || workspace.projects[0]?.name;
  assert.ok(project, "Run the existing VORQ acceptance fixture first.");
  evidence.assignedProjects = workspace.projects.length;
  const noCsrf = createClient({ baseUrl, cookie: () => sid });
  await assert.rejects(
    noCsrf.request(
      "save",
      {
        module: "site-reports",
        company,
        project,
        values: {},
        idempotency_key: randomUUID(),
      },
      true,
    ),
    (error) => [400, 403].includes(error.status),
  );
  evidence.csrfEnforced = true;
  await assert.rejects(
    client.request("records", {
      module: "sales-invoices",
      company,
      project: "DOES-NOT-EXIST",
    }),
    (error) => [403, 404, 417].includes(error.status),
  );
  evidence.projectScopeEnforced = true;
  const schema = await client.request("records", {
    module: "site-reports",
    company,
    project,
  });
  const weather = schema.fields
    .find((field) => field.name === "weather")
    .options.split("\n")
    .filter(Boolean)[0];
  const reportBody = {
    module: "site-reports",
    company,
    project,
    values: {
      report_date: new Date().toISOString().slice(0, 10),
      weather,
      progress_notes: `Mobile integration verification ${randomUUID()}`,
      blockers: "Synthetic development verification. No real project event.",
    },
    idempotency_key: randomUUID(),
  };
  const existingReport = schema.records.find(
    (row) =>
      row.report_date === reportBody.values.report_date &&
      String(row.progress_notes || "").startsWith(
        "Mobile integration verification",
      ),
  );
  if (existingReport) {
    reportBody.name = existingReport.name;
    reportBody.modified = existingReport.modified;
  }
  const report = await client.request("save", reportBody, true);
  const replay = await client.request("save", reportBody, true);
  assert.equal(report.name, replay.name);
  assert.equal(replay.replayed, true);
  evidence.reportSaved = report.name;
  evidence.idempotency = true;
  await assert.rejects(
    client.request(
      "save",
      {
        ...reportBody,
        values: { ...reportBody.values, blockers: "Different payload" },
      },
      true,
    ),
  );
  evidence.keyReuseRejected = true;
  const detail = await client.request("detail", {
    module: "site-reports",
    company,
    project,
    name: report.name,
  });
  assert.equal(detail.values.progress_notes, reportBody.values.progress_notes);
  evidence.reportReloaded = true;
  const look = (doctype) =>
    client.request("lookup", { doctype, company, project, query: "" });
  const [customers, items, uoms, centers] = await Promise.all(
    ["Customer", "Item", "UOM", "Cost Center"].map(look),
  );
  assert.ok(
    customers.length && items.length && centers.length && uoms.length,
    "Required invoice masters are missing.",
  );
  const priceLists = await look("Price List");
  assert.ok(
    priceLists.includes("VORQ Mobile Verification"),
    "The local VORQ Mobile Verification price list is required.",
  );
  const invoiceBody = {
    module: "sales-invoices",
    company,
    project,
    values: {
      customer: customers[0],
      selling_price_list: "VORQ Mobile Verification",
      posting_date: new Date().toISOString().slice(0, 10),
      items: [
        {
          item_code: items.includes("VORQ-TEST-CEMENT")
            ? "VORQ-TEST-CEMENT"
            : items[0],
          description:
            "Mobile integration verification · synthetic draft, do not submit",
          qty: 1,
          rate: 1,
          uom: uoms.includes("Nos") ? "Nos" : uoms[0],
          cost_center: centers.find((name) => /Main/.test(name)) || centers[0],
        },
      ],
    },
    idempotency_key: randomUUID(),
  };
  const invoice = await client.request("save", invoiceBody, true);
  const invoiceDetail = await client.request("detail", {
    module: "sales-invoices",
    company,
    project,
    name: invoice.name,
  });
  assert.equal(invoiceDetail.docstatus, 0);
  assert.equal(
    invoiceDetail.values.items[0].description,
    invoiceBody.values.items[0].description,
  );
  const invoiceReplay = await client.request("save", invoiceBody, true);
  assert.equal(invoiceReplay.name, invoice.name);
  assert.equal(invoiceReplay.replayed, true);
  evidence.invoiceDraftSaved = invoice.name;
  evidence.invoiceDraftReloaded = true;
  evidence.invoiceIdempotency = true;
  evidence.financialPosting = false;
  await client.request("logout", {}, true);
  await assert.rejects(client.request("session"), (error) =>
    [401, 403].includes(error.status),
  );
  evidence.logoutEnforced = true;
  await writeFile(
    new URL("../backend-verification.json", import.meta.url),
    JSON.stringify(
      { verifiedAt: new Date().toISOString(), ...evidence },
      null,
      2,
    ) + "\n",
  );
  console.log(JSON.stringify(evidence, null, 2));
} catch (error) {
  console.error("Backend verification failed:", error.message);
  process.exitCode = 1;
} finally {
  if (sid) {
    try {
      await client.request("logout", {}, true);
    } catch {}
  }
}
