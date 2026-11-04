import { useState } from "react";
import { ArrowUpRight, Eye, EyeOff, HardHat, ShieldCheck } from "lucide-react";
import { api } from "./api";
export function AuthScreen({ onLogin }: { onLogin: () => Promise<void> }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [name, setName] = useState(""),
    [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [visible, setVisible] = useState(false);
  const signup = mode === "signup";
  const switchMode = (next: "login" | "signup") => {
    setMode(next);
    setError("");
    setSuccess("");
    setPassword("");
    setConfirmation("");
  };
  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      <section className="bg-[#102d30] text-white p-7 lg:p-20 flex flex-col justify-between">
        <div className="text-3xl font-black tracking-tight">
          VORQ<span className="text-lime-300">.</span>
        </div>
        <div className="py-8 lg:py-20">
          <p className="text-lime-300 text-xs font-semibold tracking-[.25em] uppercase mb-5">
            Built for the work ahead
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-6xl leading-tight font-semibold max-w-xl">
            Every site.
            <br />
            Every cost.
            <br />
            One clear picture.
          </h1>
          <p className="mt-6 text-slate-300 max-w-sm leading-relaxed">
            Your projects, materials and financial operations, connected in one
            construction workspace.
          </p>
        </div>
        <p className="text-sm text-slate-400">
          Construction operations / Financial control
        </p>
      </section>
      <section className="bg-white p-6 sm:p-8 flex items-center justify-center">
        <form
          className="w-full max-w-sm space-y-5"
          onChange={() => {
            if (error) setError("");
          }}
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            setSuccess("");
            try {
              if (signup) {
                if (password !== confirmation)
                  throw new Error("Passwords do not match.");
                const result = await api<{ message: string }>(
                  "signup",
                  { full_name: name.trim(), email: email.trim(), password },
                  true,
                );
                setMode("login");
                setPassword("");
                setConfirmation("");
                setSuccess(result.message);
              } else {
                await api("login", { usr: email.trim(), pwd: password }, true);
                await onLogin();
              }
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="w-12 h-12 bg-emerald-50 rounded-xl grid place-items-center text-emerald-800">
            <HardHat />
          </div>
          <div>
            <h2 className="text-3xl font-semibold">
              {signup ? "Create your VORQ account" : "Welcome to VORQ"}
            </h2>
            <p className="text-slate-500 mt-2">
              {signup
                ? "Register, then join your company workspace."
                : "Sign in to your company workspace."}
            </p>
          </div>
          <div
            role="tablist"
            aria-label="Account access"
            className="flex rounded-lg bg-slate-100 p-1"
          >
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                disabled={busy}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${mode === m ? "bg-white shadow-sm text-emerald-900" : "text-slate-500"}`}
                onClick={() => switchMode(m)}
              >
                {m === "login" ? "Login" : "Sign up"}
              </button>
            ))}
          </div>
          {success && (
            <p
              role="status"
              className="text-sm bg-emerald-50 text-emerald-900 p-4 rounded-lg"
            >
              {success}
            </p>
          )}
          {signup && (
            <label className="block text-sm font-medium">
              Full name
              <input
                className="mt-2"
                name="full_name"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                minLength={2}
                maxLength={100}
                disabled={busy}
                required
              />
            </label>
          )}
          <label className="block text-sm font-medium">
            {signup ? "Email address" : "Email or username"}
            <input
              className="mt-2"
              name="email"
              type={signup ? "email" : "text"}
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={140}
              disabled={busy}
              required
            />
          </label>
          <label className="block text-sm font-medium">
            Password
            <div className="relative mt-2">
              <input
                className="!pr-12"
                name="password"
                type={visible ? "text" : "password"}
                autoComplete={signup ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={signup ? 12 : undefined}
                maxLength={128}
                disabled={busy}
                required
              />
              <button
                type="button"
                aria-label={visible ? "Hide password" : "Show password"}
                className="absolute right-3 top-3 text-slate-500"
                onClick={() => setVisible(!visible)}
              >
                {visible ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {signup && (
              <span className="block mt-1 text-xs text-slate-500">
                Use at least 12 characters.
              </span>
            )}
          </label>
          {signup && (
            <label className="block text-sm font-medium">
              Confirm password
              <input
                className="mt-2"
                name="confirmation"
                type={visible ? "text" : "password"}
                autoComplete="new-password"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                disabled={busy}
                required
              />
            </label>
          )}
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <button disabled={busy} className="primary w-full justify-center">
            {busy
              ? signup
                ? "Creating account…"
                : "Signing in…"
              : signup
                ? "Create account"
                : "Sign in"}
            <ArrowUpRight size={18} />
          </button>
          <p className="text-xs leading-relaxed text-slate-500 flex gap-2">
            <ShieldCheck size={18} className="shrink-0" />
            {signup
              ? "Creating an account does not grant access to company data. Your administrator must verify your identity and assign your workspace."
              : "Access follows your company, project assignments and role. Contact your administrator for account recovery."}
          </p>
        </form>
      </section>
    </main>
  );
}
