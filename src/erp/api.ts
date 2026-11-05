let csrf = "";
export function setCsrf(value: string) {
  csrf = value;
}
export class ApiError extends Error {
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
  status: number;
}
export async function api<T>(
  method: string,
  args: Record<string, unknown> = {},
  write = false,
): Promise<T> {
  const url = `/api/method/${method.includes(".") || ["login", "logout"].includes(method) ? method : `vorq.api.v1.${method}`}`;
  const query = new URLSearchParams(
    Object.entries(args)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => [
        k,
        typeof v === "object" ? JSON.stringify(v) : String(v),
      ]),
  );
  let response: Response;
  try {
    response = await fetch(write ? url : `${url}?${query}`, {
      method: write ? "POST" : "GET",
      credentials: "same-origin",
      headers: write
        ? { "Content-Type": "application/json", "X-Frappe-CSRF-Token": csrf }
        : {},
      body: write ? JSON.stringify(args) : undefined,
    });
  } catch {
    throw new ApiError(
      "Unable to connect to VORQ. Check your connection and try again.",
      0,
    );
  }
  const data = await response.json().catch(() => null);
  if (!data) {
    throw new ApiError(
      "VORQ is temporarily unavailable. Please try again.",
      response.status,
    );
  }
  if (response.status >= 500)
    throw new ApiError(
      "VORQ is temporarily unavailable. Please try again.",
      response.status,
    );
  if (!response.ok || data.exc) {
    const invalidLogin =
      ["login", "auth_start"].includes(method) &&
      [401, 403].includes(response.status) &&
      data.exc_type !== "CSRFTokenError";
    let message = invalidLogin
      ? "Email/username or password is incorrect. Use an account registered in this VORQ workspace."
      : response.status === 429
        ? "Too many attempts. Please wait before trying again."
        : response.status === 401
          ? "Your session has expired. Sign in again."
          : "The server could not complete this request.";
    try {
      const messages = JSON.parse(data._server_messages || "[]");
      if (messages.length && (!invalidLogin || method.startsWith("auth_")))
        message = JSON.parse(messages[messages.length - 1]).message.replace(
          /<[^>]*>/g,
          "",
        );
    } catch {
      /* Do not render server HTML or stack traces. */
    }
    throw new ApiError(message, response.status);
  }
  if (method === "login" && data.verification) {
    throw new ApiError(
      "This account requires two-factor verification. Complete verification through the secure login page.",
      403,
    );
  }
  return data.message as T;
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
export interface Module {
  id: string;
  doctype: string;
  can_create: boolean;
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
  modules: Module[];
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
  workflow_state?: string;
  actions?: string[];
  computed?: Record<string, unknown>;
  state?: string;
}
