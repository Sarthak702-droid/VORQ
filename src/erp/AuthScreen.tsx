import { useEffect, useId, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { api } from "./api";
import { Arch, Rose } from "./public/Drawings";
import { Logo } from "./public/Logo";
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
type Mode = "login" | "signup";

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  minLength,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  minLength?: number;
  disabled: boolean;
}) {
  const id = useId();
  const [shown, setShown] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="vq-field">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          className="!pr-12"
          type={shown ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          required
          minLength={minLength}
          maxLength={128}
          disabled={disabled}
        />
        <button
          type="button"
          className="vq-icon-btn absolute right-px top-[7px]"
          aria-label={shown ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={shown}
          disabled={disabled}
          onClick={() => setShown(!shown)}
        >
          {shown ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="vq-field">
      {label}
      {children}
    </label>
  );
}

export function AuthScreen({
  onLogin,
  mode = "login",
  onModeChange,
  notice,
}: {
  onLogin: () => Promise<void>;
  /** A problem reported by the host app, shown when the form has no error of its own. */
  notice?: string;
  mode?: Mode;
  onModeChange?: (mode: Mode) => void;
}) {
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
    [copied, setCopied] = useState(false),
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
  const enrolling = signup || pending?.stage === "enroll" || codes.length > 0;
  const steps = enrolling
    ? ["Details", "Authenticator", "Recovery codes"]
    : ["Credentials", "Verify"];
  const current = codes.length ? 2 : pending ? 1 : 0;
  const heading = codes.length
    ? "Save your recovery codes"
    : pending?.stage === "enroll"
      ? "Set up your authenticator"
      : pending
        ? "Verify your sign-in"
        : signup
          ? "Create your account"
          : "Sign in to VORQ";
  const lede = codes.length
    ? "Each code works once. Keep them somewhere other than this device — they will not be shown again."
    : pending?.stage === "enroll"
      ? "Scan the code with Google Authenticator, Microsoft Authenticator or another TOTP app, then enter the current code."
      : pending
        ? "Enter the current code from your authenticator app."
        : signup
          ? "Request your role. Your administrator confirms your access."
          : "One account for VORQ on web and mobile.";

  return (
    <div className="vq-public lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="vq-on-night relative hidden h-screen flex-col justify-between overflow-hidden bg-vq-night p-12 text-vq-bone lg:sticky lg:top-0 lg:flex xl:p-16">
        <div className="vq-backdrop -right-24 -top-24 w-[340px]">
          <Rose className="vq-turn" />
        </div>
        <a href="#/" aria-label="VORQ home" className="relative w-fit">
          <Logo size={30} />
        </a>
        <div className="vq-fine relative mx-auto w-full max-w-[360px] text-vq-brass-light/70">
          <Arch />
        </div>
        <div className="relative">
          <p className="vq-display text-[2.75rem] xl:text-5xl">
            Measure twice. <em>Bill once.</em>
          </p>
          <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-vq-ash">
            Estimates, procurement, stores, labour, subcontracts and billing —
            one measured record of the job.
          </p>
        </div>
      </aside>

      <main className="flex min-h-screen flex-col px-5 pb-10 pt-5 sm:px-10">
        <div className="flex items-center justify-between">
          <a href="#/" aria-label="VORQ home" className="lg:invisible">
            <Logo size={26} />
          </a>
          <a
            href="#/"
            className="vq-link inline-flex min-h-[44px] items-center gap-2 text-[13px] font-medium text-vq-soft"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Back to home
          </a>
        </div>

        <form
          className="vq-form mx-auto my-auto w-full max-w-[440px] py-10"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <ol className="vq-steps" aria-label="Progress">
            {steps.map((label, index) => (
              <li
                key={label}
                aria-current={index === current ? "step" : undefined}
                className={index < current ? "is-done" : undefined}
              >
                <span>
                  {index < current ? (
                    <Check size={13} strokeWidth={2.5} aria-label="Done:" className="-mt-0.5 mr-1 inline" />
                  ) : (
                    `${index + 1}. `
                  )}
                  <span className={index === current ? "" : "hidden sm:inline"}>
                    {label}
                  </span>
                </span>
              </li>
            ))}
          </ol>
          <h1 className="vq-display mt-6 text-[2.6rem] sm:text-5xl">{heading}</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-vq-soft">{lede}</p>

          <div
            key={codes.length ? "codes" : pending ? pending.stage : "form"}
            className="vq-swap mt-8 space-y-5"
          >
            {codes.length ? (
              <>
                <ul className="grid grid-cols-2 gap-x-6 gap-y-2.5 rounded-md border border-vq-line bg-vq-card p-5 font-mono text-[15px] tracking-wide">
                  {codes.map((value) => (
                    <li key={value}>
                      <code>{value}</code>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="vq-btn-ghost w-full"
                  onClick={async () => {
                    try {
                      // Absent outside secure contexts, so this can throw as well as reject.
                      await navigator.clipboard.writeText(codes.join("\n"));
                      setCopied(true);
                    } catch {
                      setError("Could not copy. Select the codes and copy them manually.");
                    }
                  }}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  <span aria-live="polite">
                    {copied ? "Copied to clipboard" : "Copy all codes"}
                  </span>
                </button>
                <button className="vq-btn w-full" disabled={busy}>
                  {busy ? "Opening your workspace…" : "I have saved these codes"}
                  {busy ? null : <ArrowRight size={16} className="vq-nudge" />}
                </button>
              </>
            ) : pending ? (
              <>
                {pending.stage === "enroll" ? (
                  <div className="rounded-md border border-vq-line bg-vq-card p-5">
                    <img
                      src={pending.qr_image}
                      alt="Authenticator setup QR code"
                      className="mx-auto h-52 w-52 rounded bg-white p-2"
                    />
                    <p className="vq-hint mt-4">Can’t scan? Enter this setup key:</p>
                    <code className="mt-1.5 block break-all rounded border border-vq-line bg-white px-3 py-2.5 text-[13px] tracking-wide">
                      {pending.setup_key}
                    </code>
                    <p className="vq-hint mt-3">Setup expires after 5 minutes.</p>
                  </div>
                ) : null}
                <Field label={recovery ? "Recovery code" : "6-digit authenticator code"}>
                  <input
                    className={`vq-code-input ${recovery ? "is-recovery" : ""}`}
                    autoComplete="one-time-code"
                    autoFocus
                    inputMode={recovery ? "text" : "numeric"}
                    value={code}
                    maxLength={40}
                    onChange={(event) => setCode(event.target.value)}
                    required
                    disabled={busy}
                  />
                </Field>
                <button className="vq-btn w-full" disabled={busy}>
                  {busy
                    ? "Verifying…"
                    : pending.stage === "enroll"
                      ? "Confirm and enable verification"
                      : "Verify and sign in"}
                  {busy ? null : <ArrowRight size={16} className="vq-nudge" />}
                </button>
                <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 text-[13px] font-medium text-vq-soft">
                  {pending.stage === "totp" ? (
                    <button
                      type="button"
                      className="vq-link min-h-[44px]"
                      disabled={busy}
                      onClick={() => {
                        setRecovery(!recovery);
                        setCode("");
                      }}
                    >
                      {recovery ? "Use authenticator instead" : "Use a recovery code"}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="vq-link min-h-[44px]"
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
                </div>
              </>
            ) : (
              <>
                <div role="tablist" aria-label="Account access" className="vq-tabs">
                  {(["login", "signup"] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      role="tab"
                      aria-selected={mode === value}
                      disabled={busy}
                      onClick={() => {
                        if (mode === value) return;
                        onModeChange?.(value);
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
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Full name">
                      <input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        autoComplete="name"
                        required
                        maxLength={100}
                        disabled={busy}
                      />
                    </Field>
                    <Field label="Email address">
                      <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        autoComplete="email"
                        required
                        maxLength={140}
                        disabled={busy}
                      />
                    </Field>
                  </div>
                ) : null}
                <Field label={signup ? "Username" : "Email or username"}>
                  <input
                    value={user}
                    onChange={(event) => setUser(event.target.value)}
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    required
                    maxLength={signup ? 40 : 140}
                    disabled={busy}
                  />
                </Field>
                {signup ? (
                  <>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <PasswordField
                        label="Password"
                        value={password}
                        onChange={setPassword}
                        autoComplete="new-password"
                        minLength={12}
                        disabled={busy}
                      />
                      <PasswordField
                        label="Confirm password"
                        value={confirmation}
                        onChange={setConfirmation}
                        autoComplete="new-password"
                        disabled={busy}
                      />
                    </div>
                    <p className="vq-hint !mt-2">
                      Use a unique passphrase of 12–128 characters. Predictable
                      passwords are rejected.
                    </p>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label="Company / organisation">
                        <input
                          value={company}
                          onChange={(event) => setCompany(event.target.value)}
                          autoComplete="organization"
                          required
                          maxLength={140}
                          disabled={busy}
                        />
                      </Field>
                      <Field label="Requested role">
                        <select
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
                      </Field>
                    </div>
                    {(captcha?.roles[role] || []).map((field) => (
                      <Field key={field.name} label={field.label}>
                        <input
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
                      </Field>
                    ))}
                    <p className="vq-hint !mt-2">
                      A role request never grants access. Your administrator
                      must verify your identity and assign company, project and
                      ERP permissions.
                    </p>
                  </>
                ) : (
                  <PasswordField
                    label="Password"
                    value={password}
                    onChange={setPassword}
                    autoComplete="current-password"
                    disabled={busy}
                  />
                )}
                <fieldset className="rounded-md border border-vq-line bg-vq-card px-4 pb-4 pt-2">
                  <legend className="px-1.5 text-[13px] font-medium text-vq-soft">
                    Security check
                  </legend>
                  <div className="flex items-center gap-2">
                    <div className="grid h-20 flex-1 place-items-center overflow-hidden rounded border border-vq-line bg-white">
                      {captcha ? (
                        <img
                          src={captcha.image}
                          alt="Security image: enter the six displayed characters"
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <span className="vq-hint" role="status">
                          Loading security image…
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="vq-icon-btn"
                      aria-label="Load a new security image"
                      title="New image"
                      disabled={busy}
                      onClick={() => {
                        void newCaptcha().catch((err) => setError(err.message));
                      }}
                    >
                      <RefreshCw size={17} />
                    </button>
                  </div>
                  <div className="mt-3">
                    <Field label="Characters shown above">
                      <input
                        className="font-mono !tracking-[0.25em]"
                        value={answer}
                        onChange={(event) => setAnswer(event.target.value)}
                        autoComplete="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        required
                        maxLength={6}
                        disabled={busy}
                      />
                    </Field>
                  </div>
                  <p className="vq-hint mt-2">
                    Single use. Expires after 2 minutes.
                  </p>
                </fieldset>
                <button className="vq-btn w-full" disabled={busy || !captcha}>
                  {busy
                    ? "Please wait…"
                    : signup
                      ? "Create account"
                      : "Continue to authenticator"}
                  {busy ? null : <ArrowRight size={16} className="vq-nudge" />}
                </button>
              </>
            )}
          </div>

          {error || notice ? (
            <p role="alert" className="vq-alert mt-5">
              <CircleAlert size={17} className="mt-px shrink-0" aria-hidden="true" />
              <span>{error || notice}</span>
            </p>
          ) : null}
          <p className="vq-hint mt-8 flex gap-2.5 border-t border-vq-line pt-5">
            <ShieldCheck size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            Password, security image and authenticator verification protect
            your VORQ session.
          </p>
        </form>
      </main>
    </div>
  );
}
