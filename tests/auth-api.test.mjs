import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { api, setCsrf } from "../src/erp/api.ts";
const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
  setCsrf("");
});
function respond(status, body) {
  globalThis.fetch = async () => new Response(JSON.stringify(body), { status });
}
test("invalid credentials are not described as an expired session", async () => {
  respond(401, {
    message: "Invalid login credentials",
    exc_type: "AuthenticationError",
  });
  await assert.rejects(
    api("login", { usr: "unregistered@example.invalid", pwd: "wrong" }, true),
    (e) =>
      /password is incorrect/.test(e.message) && !/expired/.test(e.message),
  );
});
test("an expired authenticated session keeps its recovery message", async () => {
  respond(401, { exc_type: "AuthenticationError" });
  await assert.rejects(api("session"), /session has expired/);
});
test("successful login uses the real Frappe login endpoint and cookies", async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "/api/method/login");
    assert.equal(options.credentials, "same-origin");
    assert.equal(options.method, "POST");
    return new Response(JSON.stringify({ message: "Logged In" }));
  };
  assert.equal(
    await api("login", { usr: "Administrator", pwd: "test-only" }, true),
    "Logged In",
  );
});
test("offline and gateway failures stay errors rather than login success", async () => {
  globalThis.fetch = async () => {
    throw new TypeError("fetch failed");
  };
  await assert.rejects(api("login", {}, true), /Unable to connect/);
  globalThis.fetch = async () => new Response("Bad Gateway", { status: 502 });
  await assert.rejects(api("login", {}, true), /temporarily unavailable/);
});

test("auth password step returns a pending challenge, never implies sign-in", async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "/api/method/vorq.api.v1.auth_start");
    assert.equal(options.credentials, "same-origin");
    return Response.json({ message: { stage: "totp", challenge: "pending" } });
  };
  assert.equal((await api("auth_start", {}, true)).stage, "totp");
});
test("authenticator errors retain their actionable message", async () => {
  respond(401, {
    exc: true,
    _server_messages: JSON.stringify([
      JSON.stringify({
        message: "Code is incorrect, expired or already used.",
      }),
    ]),
  });
  await assert.rejects(api("auth_finish", {}, true), /already used/);
});
