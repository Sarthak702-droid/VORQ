import { useEffect, useState } from "react";
import { ShieldCheck, RefreshCw } from "lucide-react";
import { api } from "./api";
type Captcha = {
  id: string;
  image: string;
  roles: Record<string, { name: string; label: string }[]>;
};
type Pending = {
  challenge: string;
  stage: "enroll" | "totp";
  qr_image?: string;
  setup_key?: string;
};
export function AuthScreen({ onLogin }: { onLogin: () => Promise<void> }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [user, setUser] = useState(""),
    [password, setPassword] = useState(""),
    [confirmation, setConfirmation] = useState(""),
    [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [company, setCompany] = useState(""),
    [role, setRole] = useState("");
  const [details, setDetails] = useState<Record<string, string>>({}),
    [captcha, setCaptcha] = useState<Captcha | null>(null),
    [answer, setAnswer] = useState(""),
    [pending, setPending] = useState<Pending | null>(null),
    [code, setCode] = useState(""),
    [codes, setCodes] = useState<string[]>([]),
    [recovery, setRecovery] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    api<Captcha>("auth_challenge")
      .then((result) => {
        if (active) setCaptcha(result);
      })
      .catch((err) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, []);
  async function newCaptcha(keepError = false) {
    if (!keepError) setError("");
    setCaptcha(null);
    setAnswer("");
    setCaptcha(await api<Captcha>("auth_challenge"));
  }
  async function submit() {
    setBusy(true);
    setError("");
    try {
      if (codes.length) {
        await onLogin();
        return;
      }
      if (pending) {
        const result = await api<{ recovery_codes: string[] }>(
          "auth_finish",
          { challenge_token: pending.challenge, code: code.trim() },
          true,
        );
        setPending(null);
        setCode("");
        if (result.recovery_codes.length) setCodes(result.recovery_codes);
        else await onLogin();
        return;
      }
      if (!captcha) throw new Error("Refresh the security image.");
      if (mode === "signup" && password !== confirmation)
        throw new Error("Passwords do not match.");
      const result =
        mode === "login"
          ? await api<Pending>(
              "auth_start",
              {
                usr: user,
                pwd: password,
                captcha_id: captcha.id,
                captcha_answer: answer,
              },
              true,
            )
          : await api<Pending>(
              "auth_signup",
              {
                full_name: name,
                username: user,
                email,
                password,
                company_name: company,
                requested_role: role,
                role_details: details,
                captcha_id: captcha.id,
                captcha_answer: answer,
              },
              true,
            );
      setPending(result);
      setPassword("");
      setConfirmation("");
      setCaptcha(null);
      setAnswer("");
      setCode("");
    } catch (err) {
      setError((err as Error).message);
      if (!pending && !codes.length) {
        try {
          await newCaptcha(true);
        } catch {}
      }
    } finally {
      setBusy(false);
    }
  }
  const signup = mode === "signup";
  return (
    <main className="auth-screen min-h-screen px-5 py-10">
      <form
        className="auth-card mx-auto max-w-md space-y-5 rounded-2xl border border-slate-200 bg-white p-7"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <div className="flex items-center gap-3">
          <img
            src="/assets/vorq-logo.svg"
            alt="VORQ logo"
            className="h-12 w-16 object-contain"
          />
          <span className="text-xl font-bold tracking-widest">VORQ</span>
        </div>
        <div>
          <h1 className="text-2xl font-semibold">
            {codes.length
              ? "Save recovery codes"
              : pending?.stage === "enroll"
                ? "Set up your authenticator"
                : pending
                  ? "Verify your sign-in"
                  : signup
                    ? "Create your account"
                    : "Sign in to VORQ"}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            One account for VORQ mobile and desktop.
          </p>
        </div>
        {codes.length ? (
          <>
            <p className="text-sm text-slate-600">
              Each code works once. Save these outside this device; they will
              not be shown again.
            </p>
            <div className="grid gap-2 rounded-lg bg-slate-50 p-4 font-mono text-sm">
              {codes.map((value) => (
                <code key={value}>{value}</code>
              ))}
            </div>
            <button className="primary w-full justify-center" disabled={busy}>
              I saved these codes — continue
            </button>
          </>
        ) : pending ? (
          <>
            {pending.stage === "enroll" ? (
              <>
                <p className="text-sm text-slate-600">
                  Scan with Google Authenticator, Microsoft Authenticator or
                  another TOTP app. Then enter a current code to enable
                  verification.
                </p>
                <img
                  src={pending.qr_image}
                  alt="Authenticator setup QR code"
                  className="mx-auto h-64 w-64"
                />
                <p className="text-xs text-slate-500">
                  Can’t scan? Enter this setup key:
                </p>
                <code className="block break-all rounded-lg bg-slate-50 p-3 text-sm">
                  {pending.setup_key}
                </code>
                <p className="text-xs text-slate-500">
                  Setup expires after 5 minutes.
                </p>
              </>
            ) : null}
            <label className="block text-sm font-medium">
              {recovery ? "Recovery code" : "6-digit authenticator code"}
              <input
                className="mt-2"
                autoComplete="one-time-code"
                inputMode={recovery ? "text" : "numeric"}
                value={code}
                maxLength={40}
                onChange={(event) => setCode(event.target.value)}
                required
                disabled={busy}
              />
            </label>
            {pending.stage === "totp" ? (
              <button
                type="button"
                className="secondary"
                disabled={busy}
                onClick={() => {
                  setRecovery(!recovery);
                  setCode("");
                }}
              >
                {recovery ? "Use authenticator instead" : "Use a recovery code"}
              </button>
            ) : null}
            <button className="primary w-full justify-center" disabled={busy}>
              {busy
                ? "Verifying…"
                : pending.stage === "enroll"
                  ? "Confirm and enable TOTP"
                  : "Verify and sign in"}
            </button>
            <button
              type="button"
              className="secondary"
              disabled={busy}
              onClick={() => {
                setPending(null);
                setCode("");
                setRecovery(false);
                setError("");
                void newCaptcha().catch((err) => setError(err.message));
              }}
            >
              Start again
            </button>
          </>
        ) : (
          <>
            <div
              role="tablist"
              aria-label="Account access"
              className="flex rounded-lg bg-slate-100 p-1"
            >
              {(["login", "signup"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={mode === value}
                  disabled={busy}
                  className={`flex-1 rounded-md px-3 py-2 text-sm ${mode === value ? "bg-white font-semibold shadow-sm" : ""}`}
                  onClick={() => {
                    setMode(value);
                    setPassword("");
                    setConfirmation("");
                    setError("");
                  }}
                >
                  {value === "login" ? "Sign in" : "Create account"}
                </button>
              ))}
            </div>
            {signup ? (
              <>
                <label className="block text-sm font-medium">
                  Full name
                  <input
                    className="mt-2"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="name"
                    required
                    maxLength={100}
                    disabled={busy}
                  />
                </label>
                <label className="block text-sm font-medium">
                  Email address
                  <input
                    className="mt-2"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    required
                    maxLength={140}
                    disabled={busy}
                  />
                </label>
              </>
            ) : null}
            <label className="block text-sm font-medium">
              {signup ? "Username" : "Email or username"}
              <input
                className="mt-2"
                value={user}
                onChange={(event) => setUser(event.target.value)}
                autoComplete="username"
                required
                maxLength={signup ? 40 : 140}
                disabled={busy}
              />
            </label>
            <label className="block text-sm font-medium">
              Password
              <input
                className="mt-2"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={signup ? "new-password" : "current-password"}
                required
                minLength={signup ? 12 : undefined}
                maxLength={128}
                disabled={busy}
              />
            </label>
            {signup ? (
              <>
                <p className="text-xs text-slate-500">
                  Use a unique passphrase of 12–128 characters. Predictable
                  passwords are rejected.
                </p>
                <label className="block text-sm font-medium">
                  Confirm password
                  <input
                    className="mt-2"
                    type="password"
                    value={confirmation}
                    onChange={(event) => setConfirmation(event.target.value)}
                    autoComplete="new-password"
                    required
                    maxLength={128}
                    disabled={busy}
                  />
                </label>
                <label className="block text-sm font-medium">
                  Company / organisation
                  <input
                    className="mt-2"
                    value={company}
                    onChange={(event) => setCompany(event.target.value)}
                    required
                    maxLength={140}
                    disabled={busy}
                  />
                </label>
                <label className="block text-sm font-medium">
                  Requested role
                  <select
                    className="mt-2"
                    required
                    value={role}
                    disabled={busy}
                    onChange={(event) => {
                      setRole(event.target.value);
                      setDetails({});
                    }}
                  >
                    <option value="">Choose your role</option>
                    {Object.keys(captcha?.roles || {}).map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </label>
                {(captcha?.roles[role] || []).map((field) => (
                  <label key={field.name} className="block text-sm font-medium">
                    {field.label}
                    <input
                      className="mt-2"
                      value={details[field.name] || ""}
                      onChange={(event) =>
                        setDetails((current) => ({
                          ...current,
                          [field.name]: event.target.value,
                        }))
                      }
                      required
                      maxLength={200}
                      disabled={busy}
                    />
                  </label>
                ))}
                <p className="text-xs leading-relaxed text-slate-500">
                  A role request never grants access. Your administrator must
                  verify your identity and assign company, project and ERP
                  permissions.
                </p>
              </>
            ) : null}
            <div className="space-y-3 rounded-lg border p-4">
              <span className="text-sm font-medium">Security image</span>
              {captcha ? (
                <img
                  src={captcha.image}
                  alt="Security image: enter the six displayed characters"
                  className="h-24 w-full object-contain"
                />
              ) : (
                <p className="text-sm text-slate-500">
                  Loading security image…
                </p>
              )}
              <button
                type="button"
                className="secondary"
                disabled={busy}
                onClick={() => {
                  void newCaptcha().catch((err) => setError(err.message));
                }}
              >
                <RefreshCw size={15} />
                Refresh image
              </button>
              <label className="block text-sm font-medium">
                Characters from image
                <input
                  className="mt-2"
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  autoComplete="off"
                  required
                  maxLength={6}
                  disabled={busy}
                />
              </label>
              <p className="text-xs text-slate-500">
                Expires after 2 minutes. Single use.
              </p>
            </div>
            <button
              className="primary w-full justify-center"
              disabled={busy || !captcha}
            >
              {busy
                ? "Please wait…"
                : signup
                  ? "Create account and set up TOTP"
                  : "Continue to authenticator"}
            </button>
          </>
        )}
        {error ? (
          <p role="alert" className="error">
            {error}
          </p>
        ) : null}
        <p className="flex gap-2 text-xs leading-relaxed text-slate-500">
          <ShieldCheck size={18} className="shrink-0" />
          Password, security image and authenticator verification protect your
          VORQ session.
        </p>
      </form>
    </main>
  );
}
