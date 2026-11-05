// Server-only fixed-upstream proxy; never import this module in a native screen.
const allowed =
  /^\/api\/method\/(?:login|logout|vorq\.api\.v1\.(?:session|workspace|records|detail|save|transition|overview|lookup|auth_challenge|auth_start|auth_signup|auth_finish))$/;
export async function proxyRequest(
  request: Request,
  target = process.env.VORQ_BACKEND_URL || "http://127.0.0.1:18080",
  fetcher: typeof fetch = fetch,
) {
  const source = new URL(request.url);
  if (
    !allowed.test(source.pathname) ||
    !["GET", "POST"].includes(request.method)
  )
    return Response.json({ exc: "Forbidden" }, { status: 403 });
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== source.host)
    return Response.json({ exc: "Forbidden" }, { status: 403 });
  const upstream = new URL(target);
  if (
    !["http:", "https:"].includes(upstream.protocol) ||
    upstream.username ||
    upstream.password
  )
    return Response.json({ exc: "BackendMisconfigured" }, { status: 503 });
  const headers = new Headers();
  for (const key of [
    "accept",
    "content-type",
    "cookie",
    "x-frappe-csrf-token",
  ]) {
    const value = request.headers.get(key);
    if (value) headers.set(key, value);
  }
  try {
    const response = await fetcher(
      new URL(source.pathname + source.search, upstream.origin),
      {
        method: request.method,
        headers,
        body: request.method === "POST" ? await request.text() : undefined,
        redirect: "manual",
        signal: AbortSignal.timeout(30000),
      },
    );
    if (response.status >= 300 && response.status < 400)
      return Response.json({ exc: "BackendRedirect" }, { status: 502 });
    const output = new Headers({
      "Content-Type":
        response.headers.get("content-type") || "application/json",
      "Cache-Control": "no-store",
    });
    for (const cookie of response.headers.getSetCookie())
      output.append("set-cookie", cookie);
    return new Response(await response.text(), {
      status: response.status,
      headers: output,
    });
  } catch {
    return Response.json({ exc: "BackendUnavailable" }, { status: 502 });
  }
}
