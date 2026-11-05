export type BillKind = "Client claim" | "Subcontract bill" | "Site expense";
export interface Project {
  id: string;
  name: string;
  client: string;
  location: string;
}
export interface BillLine {
  description: string;
  unit: string;
  quantity: string;
  rate: string;
}
export interface Bill {
  id: string;
  projectId: string;
  kind: BillKind;
  party: string;
  reference: string;
  date: string;
  lines: BillLine[];
  deduction: string;
  notes: string;
  createdAt: string;
}
export interface SiteRecord {
  id: string;
  projectId: string;
  date: string;
  workers: number;
  work: string;
  blockers: string;
  createdAt: string;
}
export interface Store {
  version: 1;
  projects: Project[];
  bills: Bill[];
  siteRecords: SiteRecord[];
}
export const emptyStore: Store = {
  version: 1,
  projects: [],
  bills: [],
  siteRecords: [],
};

// Amounts are stored/calculated in paise. This draft calculator does not infer taxes.
export function decimal(value: string, label: string, maxDecimals = 2): number {
  const trimmed = value.trim();
  if (!new RegExp(`^\\d+(?:\\.\\d{1,${maxDecimals}})?$`).test(trimmed))
    throw new Error(
      `${label}: enter a positive number with up to ${maxDecimals} decimal places.`,
    );
  const number = Number(trimmed);
  if (!Number.isFinite(number) || number > 100000000)
    throw new Error(`${label} is too large.`);
  return number;
}
export function totals(lines: BillLine[], deduction: string) {
  if (!lines.length) throw new Error("Add at least one work item.");
  const gross = lines.reduce((sum, line) => {
    if (!line.description.trim() || !line.unit.trim())
      throw new Error("Every item needs a description and unit.");
    const quantity = decimal(line.quantity, "Quantity", 3);
    const rate = Math.round(decimal(line.rate, "Rate") * 100);
    if (quantity <= 0 || rate <= 0)
      throw new Error("Quantity and rate must be greater than zero.");
    const next = sum + Math.round(quantity * rate);
    if (!Number.isSafeInteger(next))
      throw new Error("Bill total is too large.");
    return next;
  }, 0);
  const deductions = Math.round(decimal(deduction, "Deductions") * 100);
  if (deductions > gross)
    throw new Error("Deductions cannot exceed the work amount.");
  return { gross, deductions, net: gross - deductions };
}
export function money(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
export function localDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
export function validDate(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value
  );
}
export function billSummary(bill: Bill, project: Project) {
  const total = totals(bill.lines, bill.deduction);
  return [
    "VORQ · LOCAL DRAFT · Not a tax invoice",
    project.name,
    `${bill.kind} · ${bill.date}`,
    `Party: ${bill.party}`,
    `Reference: ${bill.reference || bill.id}`,
    ...bill.lines.map(
      (line) =>
        `${line.description}: ${line.quantity} ${line.unit} × ₹${line.rate}`,
    ),
    `Work amount: ${money(total.gross)}`,
    `Deductions: ${money(total.deductions)}`,
    `Draft amount: ${money(total.net)}`,
    "Tax has not been calculated. Subject to finance review.",
    bill.notes,
  ]
    .filter(Boolean)
    .join("\n");
}

export function decodeStore(raw: string): Store {
  const data = JSON.parse(raw) as Store;
  if (
    data.version !== 1 ||
    !Array.isArray(data.projects) ||
    !Array.isArray(data.bills) ||
    !Array.isArray(data.siteRecords)
  )
    throw new Error("Unsupported saved data.");
  const string = (value: unknown): value is string => typeof value === "string";
  const ids = new Set<string>();
  for (const project of data.projects) {
    if (
      !project ||
      !string(project.id) ||
      ids.has(project.id) ||
      !string(project.name) ||
      !project.name.trim() ||
      !string(project.client) ||
      !string(project.location)
    )
      throw new Error("Invalid project data.");
    ids.add(project.id);
  }
  const recordIds = new Set<string>();
  for (const bill of data.bills) {
    if (
      !bill ||
      !string(bill.id) ||
      recordIds.has(bill.id) ||
      !ids.has(bill.projectId) ||
      !["Client claim", "Subcontract bill", "Site expense"].includes(
        bill.kind,
      ) ||
      !string(bill.party) ||
      !bill.party.trim() ||
      !string(bill.reference) ||
      !string(bill.notes) ||
      !string(bill.createdAt) ||
      !string(bill.date) ||
      !validDate(bill.date) ||
      !Array.isArray(bill.lines) ||
      !string(bill.deduction)
    )
      throw new Error("Invalid bill data.");
    for (const line of bill.lines)
      if (
        !line ||
        ![line.description, line.unit, line.quantity, line.rate].every(string)
      )
        throw new Error("Invalid work item.");
    totals(bill.lines, bill.deduction);
    recordIds.add(bill.id);
  }
  for (const record of data.siteRecords) {
    if (
      !record ||
      !string(record.id) ||
      recordIds.has(record.id) ||
      !ids.has(record.projectId) ||
      !string(record.date) ||
      !validDate(record.date) ||
      !Number.isInteger(record.workers) ||
      record.workers < 0 ||
      record.workers > 10000 ||
      !string(record.work) ||
      !record.work.trim() ||
      !string(record.blockers) ||
      !string(record.createdAt)
    )
      throw new Error("Invalid site record.");
    recordIds.add(record.id);
  }
  return data;
}
