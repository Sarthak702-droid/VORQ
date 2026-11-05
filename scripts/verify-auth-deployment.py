#!/usr/bin/env python3
"""Check the deployed guest auth contract without creating users or sessions."""
import base64
import json
import time
import urllib.error
import urllib.request


def verify(base="http://127.0.0.1:18080"):
    url = base + "/api/method/vorq.api.v1.auth_challenge"
    # Gunicorn/nginx may still be starting immediately after a deployment.
    for attempt in range(20):
        try:
            with urllib.request.urlopen(url, timeout=5) as response:
                challenge = json.load(response)["message"]
            break
        except (urllib.error.URLError, TimeoutError):
            if attempt == 19:
                raise
            time.sleep(2)
    assert len(challenge["id"]) >= 32, "Missing CAPTCHA token"
    assert challenge["expires_in"] == 120, "Unexpected CAPTCHA expiry"
    assert challenge["roles"], "Registration roles missing"
    prefix = "data:image/png;base64,"
    assert challenge["image"].startswith(prefix), "CAPTCHA image missing"
    assert base64.b64decode(challenge["image"][len(prefix):], validate=True).startswith(b"\x89PNG\r\n\x1a\n")
    # Each POST must resolve to a handler and reject invalid security input.
    payloads = {
        "auth_start": {"usr": "deployment-check@example.invalid", "pwd": "invalid", "captcha_id": "x" * 43, "captcha_answer": "invalid"},
        "auth_signup": {"full_name": "Deployment Check", "username": "deployment-check", "email": "deployment-check@example.invalid", "password": "invalid", "requested_role": "Owner", "company_name": "Check", "role_details": {}, "captcha_id": "x" * 43, "captcha_answer": "invalid"},
        "auth_finish": {"challenge_token": "x" * 43, "code": "000000"},
    }
    for method, payload in payloads.items():
        request = urllib.request.Request(base + "/api/method/vorq.api.v1." + method,
                                         data=json.dumps(payload).encode(),
                                         headers={"Content-Type": "application/json"})
        try:
            urllib.request.urlopen(request, timeout=10)
        except urllib.error.HTTPError as exc:
            error = json.load(exc)
            # Repeated smoke checks share the guest IP's auth rate limits.
            expected = (exc.code, error.get("exc_type")) in {
                (401, "AuthenticationError"), (429, "RateLimitExceededError")}
            assert expected, (method, exc.code, error.get("exc_type"))
        else:
            raise AssertionError(method + " accepted invalid security input")
    print("Auth deployment verified: CAPTCHA PNG + roles, all 4 routes resolve, invalid requests denied (authentication/rate limit).")


if __name__ == "__main__":
    verify()
