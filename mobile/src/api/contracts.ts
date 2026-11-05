export interface Session {
  user: string;
  full_name: string;
  companies: string[];
  csrf_token: string;
}
export interface Project {
  name: string;
  project_name: string;
  status: string;
  percent_complete: number;
  expected_end_date?: string;
}
export interface Workspace {
  role: string;
  projects: Project[];
  modules: { id: string; doctype: string; can_create: boolean }[];
}
export interface Field {
  name: string;
  label: string;
  type: string;
  required: boolean;
  options?: string;
  default?: string;
  children?: Field[];
}
export interface RecordRow {
  name: string;
  docstatus: number;
  modified: string;
  [key: string]: unknown;
}
export interface RecordPage {
  records: RecordRow[];
  fields: Field[];
  submittable: boolean;
  next_start: number | null;
}
export interface RecordDetail {
  name: string;
  docstatus: number;
  modified: string;
  values: Record<string, unknown>;
  actions?: string[];
  computed?: Record<string, unknown>;
  state?: string;
  workflow_state?: string;
}
export interface Overview {
  progress: number;
  status: string;
  financials: null | { expense: string; income_balance: string };
}
export const moduleLabels: Record<string, string> = {
  "sales-invoices": "Client invoices",
  "purchase-invoices": "Supplier invoices",
  "ra-bills": "Subcontractor bills",
  expenses: "Expenses",
  projects: "Projects",
  "site-reports": "Site reports",
  labour: "Labour attendance",
};
export function displayValue(value: unknown): string {
  return value === null || value === undefined
    ? "—"
    : String(value).replace(/<[^>]*>/g, "");
}
export function formatAmount(value: unknown) {
  const number = Number(value);
  return value === null ||
    value === undefined ||
    value === "" ||
    !Number.isFinite(number)
    ? "Unavailable"
    : `₹${number.toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
}
export function recordTitle(row: RecordRow) {
  return displayValue(
    row.project_name ||
      row.customer ||
      row.supplier ||
      row.subcontractor ||
      row.employee ||
      row.report_date ||
      row.name,
  );
}
export function documentState(row: { docstatus: number }) {
  return row.docstatus === 1
    ? "Submitted"
    : row.docstatus === 2
      ? "Cancelled"
      : "Draft";
}
export function fieldDefaults(fields: Field[]): Record<string, unknown> {
  return Object.fromEntries(
    fields
      .filter((f) => f.default && !f.default.startsWith(":"))
      .map((f) => [
        f.name,
        f.default === "Today"
          ? new Date().toLocaleDateString("en-CA")
          : f.default,
      ]),
  );
}
