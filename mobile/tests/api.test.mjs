import test from "node:test";
import assert from "node:assert/strict";
import { createClient, ApiError, apiPath } from "../src/api/client.ts";
import { proxyRequest } from "../src/api/proxy.ts";
test("client sends session cookies, CSRF, scoped arguments and serialized values", async () => {
  let captured;
  const client = createClient({
    baseUrl: "https://vorq.test",
    cookie: () => "test-session",
    fetcher: async (url, options) => {
      captured = { url, options };
      return Response.json({ message: { name: "INV-1" } });
    },
  });
  client.setCsrf("csrf-test");
  await client.request(
    "save",
    {
      company: "Company A",
      project: "P-1",
      values: { items: [] },
      idempotency_key: "stable-key-for-retry",
    },
    true,
  );
  assert.equal(captured.url, "https://vorq.test/api/method/vorq.api.v1.save");
  assert.equal(captured.options.headers.Cookie, "sid=test-session");
  assert.equal(captured.options.headers["X-Frappe-CSRF-Token"], "csrf-test");
  assert.equal(JSON.parse(captured.options.body).project, "P-1");
  await client.request("records", { company: "Company A", start: 50 });
  assert.match(captured.url, /company=Company\+A&start=50/);
});
test("unsupported API methods are blocked before fetching", () => {
  assert.throws(() => apiPath("frappe.client.get_list"), ApiError);
});
test("expired sessions invalidate auth; permission errors keep useful messages without HTML", async () => {
  let expired = false;
  const client = createClient({
    onExpired: () => {
      expired = true;
    },
    fetcher: async () =>
      Response.json(
        { exc: "hidden traceback", exc_type: "AuthenticationError" },
        { status: 403 },
      ),
  });
  await assert.rejects(client.request("session"), /session has expired/);
  assert.equal(expired, true);
  const denied = createClient({
    fetcher: async () =>
      Response.json(
        {
          exc: "secret traceback",
          _server_messages: JSON.stringify([
            JSON.stringify({ message: "<b>Project access denied.</b>" }),
          ]),
        },
        { status: 403 },
      ),
  });
  await assert.rejects(
    denied.request("records"),
    (error) => error.message === "Project access denied.",
  );
});
test("native login captures sid only after successful authentication, never a pending 2FA session", async () => {
  let saved = "";
  const client = createClient({
    onCookie: async (value) => {
      saved = value;
    },
    fetcher: async () =>
      Response.json(
        { message: "Logged In" },
        { headers: { "set-cookie": "sid=native-session; HttpOnly; Path=/" } },
      ),
  });
  await client.request("login", {}, true);
  assert.equal(saved, "native-session");
  saved = "";
  const pending = createClient({
    onCookie: async (value) => {
      saved = value;
    },
    fetcher: async () =>
      Response.json(
        { verification: true },
        { headers: { "set-cookie": "sid=pending; Path=/" } },
      ),
  });
  await assert.rejects(pending.request("login", {}, true), /Two-factor/);
  assert.equal(saved, "");
});
test("network and non-JSON failures become safe errors", async () => {
  const down = createClient({
    fetcher: async () => {
      throw new Error("internal stack");
    },
  });
  await assert.rejects(down.request("session"), /Cannot reach VORQ/);
  const html = createClient({
    fetcher: async () =>
      new Response("<html>private internal error</html>", { status: 502 }),
  });
  await assert.rejects(html.request("session"), /server is unavailable/);
});
test("proxy blocks raw ERP paths and foreign browser origins", async () => {
  let calls = 0;
  const fetcher = async () => {
    calls++;
    return Response.json({});
  };
  assert.equal(
    (
      await proxyRequest(
        new Request("https://mobile.test/api/resource/User"),
        "https://erp.test",
        fetcher,
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await proxyRequest(
        new Request("https://mobile.test/api/method/login", {
          method: "POST",
          headers: { Origin: "https://attacker.test" },
        }),
        "https://erp.test",
        fetcher,
      )
    ).status,
    403,
  );
  assert.equal(calls, 0);
});
test("proxy forwards session and CSRF to the fixed backend, preserving HTTP status and cookies", async () => {
  let captured;
  const response = await proxyRequest(
    new Request("https://mobile.test/api/method/vorq.api.v1.save", {
      method: "POST",
      headers: {
        Origin: "https://mobile.test",
        Cookie: "sid=test",
        "X-Frappe-CSRF-Token": "csrf",
        "Content-Type": "application/json",
      },
      body: '{"module":"projects"}',
    }),
    "https://erp.test",
    async (url, options) => {
      captured = { url: String(url), options };
      return Response.json(
        { message: { name: "P-1" } },
        { headers: { "set-cookie": "sid=test; HttpOnly; Path=/" } },
      );
    },
  );
  assert.equal(captured.url, "https://erp.test/api/method/vorq.api.v1.save");
  assert.equal(captured.options.headers.get("cookie"), "sid=test");
  assert.equal(captured.options.headers.get("x-frappe-csrf-token"), "csrf");
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.match(response.headers.get("set-cookie"), /HttpOnly/);
  assert.equal((await response.json()).message.name, "P-1");
});

test("TOTP completion persists native sid and CAPTCHA errors do not expire a session", async () => {
  let sid = "";
  let expired = false;
  const client = createClient({
    onCookie: async (value) => {
      sid = value;
    },
    onExpired: () => {
      expired = true;
    },
    fetcher: async () =>
      Response.json(
        { message: { authenticated: true, recovery_codes: [] } },
        { headers: { "set-cookie": "sid=verified; HttpOnly; Path=/" } },
      ),
  });
  await client.request(
    "auth_finish",
    { challenge_token: "pending", code: "123456" },
    true,
  );
  assert.equal(sid, "verified");
  const invalid = createClient({
    onExpired: () => {
      expired = true;
    },
    fetcher: async () =>
      Response.json(
        {
          exc: true,
          exc_type: "AuthenticationError",
          _server_messages: JSON.stringify([
            JSON.stringify({
              message: "Security image is incorrect or expired.",
            }),
          ]),
        },
        { status: 401 },
      ),
  });
  await assert.rejects(
    invalid.request("auth_start", {}, true),
    /Security image/,
  );
  assert.equal(expired, false);
});
