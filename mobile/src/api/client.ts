export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}
const methods = new Set([
  "login",
  "auth_challenge",
  "auth_start",
  "auth_signup",
  "auth_finish",
  "logout",
  "session",
  "workspace",
  "records",
  "detail",
  "save",
  "transition",
  "overview",
  "lookup",
]);
export function apiPath(method: string) {
  if (!methods.has(method)) throw new ApiError("Unsupported VORQ operation.");
  return `/api/method/${["login", "logout"].includes(method) ? method : `vorq.api.v1.${method}`}`;
}
export function serverError(
  data: Record<string, unknown>,
  status: number,
  method: string,
) {
  if (
    method === "login" &&
    [401, 403].includes(status) &&
    data.exc_type !== "CSRFTokenError"
  )
    return "Username or password is incorrect.";
  if (
    !method.startsWith("auth_") &&
    (status === 401 || data.exc_type === "AuthenticationError")
  )
    return "Your session has expired. Please sign in again.";
  if (status >= 500) return "The VORQ server is unavailable. Please try again.";
  if (status === 429) return "Too many attempts. Please wait and try again.";
  try {
    const messages = JSON.parse(String(data._server_messages || "[]"));
    const last = JSON.parse(messages[messages.length - 1]);
    if (typeof last.message === "string")
      return last.message.replace(/<[^>]*>/g, "").slice(0, 600);
  } catch {
    /* Never expose server traceback or HTML. */
  }
  if (method === "auth_start" && [401, 403].includes(status))
    return "Username or password is incorrect.";
  return status === 403
    ? "Your VORQ account does not have permission for this action."
    : "VORQ could not complete this request. Please try again.";
}
export function createClient({
  baseUrl = "",
  fetcher = fetch,
  cookie,
  onCookie,
  onExpired,
}: {
  baseUrl?: string;
  fetcher?: typeof fetch;
  cookie?: () => string;
  onCookie?: (value: string) => Promise<void>;
  onExpired?: () => void;
}) {
  let csrf = "";
  return {
    setCsrf(token: string) {
      csrf = token;
    },
    async request<T>(
      method: string,
      args: Record<string, unknown> = {},
      write = false,
    ): Promise<T> {
      const path = apiPath(method);
      const query = new URLSearchParams(
        Object.entries(args)
          .filter(([, value]) => value !== undefined && value !== null)
          .map(([key, value]) => [
            key,
            typeof value === "object" ? JSON.stringify(value) : String(value),
          ]),
      );
      const headers: Record<string, string> = { Accept: "application/json" };
      if (write) {
        headers["Content-Type"] = "application/json";
        if (csrf) headers["X-Frappe-CSRF-Token"] = csrf;
      }
      const sid = cookie?.();
      if (sid) headers.Cookie = `sid=${sid}`;
      let response: Response;
      try {
        response = await fetcher(
          `${baseUrl}${path}${!write && query.size ? `?${query}` : ""}`,
          {
            method: write ? "POST" : "GET",
            headers,
            credentials: "include",
            body: write ? JSON.stringify(args) : undefined,
            signal: AbortSignal.timeout(30000),
          },
        );
      } catch {
        throw new ApiError(
          "Cannot reach VORQ. Check your connection and the server address.",
        );
      }
      const data = await response.json().catch(() => null);
      if (!data)
        throw new ApiError(
          "The VORQ server is unavailable. Please try again.",
          response.status,
        );
      if (!response.ok || data.exc) {
        if (
          method !== "login" &&
          !method.startsWith("auth_") &&
          (response.status === 401 || data.exc_type === "AuthenticationError")
        )
          onExpired?.();
        throw new ApiError(
          serverError(data, response.status, method),
          response.status,
        );
      }
      if (method === "login" && data.verification)
        throw new ApiError(
          "Two-factor verification is required. Sign in through your organisation’s secure login.",
          403,
        );
      if (
        (method === "login" || method === "auth_finish") &&
        response.ok &&
        onCookie
      ) {
        const match = response.headers
          .get("set-cookie")
          ?.match(/(?:^|[,;]\s*)sid=([^;,\s]+)/);
        if (match && match[1] !== "Guest") await onCookie(match[1]);
      }
      return data.message as T;
    },
  };
}
