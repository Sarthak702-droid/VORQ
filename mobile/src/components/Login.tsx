import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { client } from "../api/runtime";
import { useWorkspace } from "../state/Workspace";
import { Brand } from "./Brand";
import { Button, colors, message, styles } from "./ui";
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
function AuthField({
  label,
  value,
  onChange,
  secure = false,
  email = false,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  secure?: boolean;
  email?: boolean;
  disabled?: boolean;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        secureTextEntry={secure}
        editable={!disabled}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType={email ? "email-address" : "default"}
        maxLength={secure ? 128 : 200}
        style={styles.input}
      />
    </View>
  );
}
export function Login() {
  const { login, checking, busy: sessionBusy, refresh } = useWorkspace();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [details, setDetails] = useState<Record<string, string>>({});
  const [rolesOpen, setRolesOpen] = useState(false);
  const [captcha, setCaptcha] = useState<Captcha | null>(null);
  const [answer, setAnswer] = useState("");
  const [pending, setPending] = useState<Pending | null>(null);
  const [code, setCode] = useState("");
  const [codes, setCodes] = useState<string[]>([]);
  const [recovery, setRecovery] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (checking) return;
    let active = true;
    client
      .request<Captcha>("auth_challenge")
      .then((result) => {
        if (active) setCaptcha(result);
      })
      .catch((err) => {
        if (active) setError(message(err));
      });
    return () => {
      active = false;
    };
  }, [checking]);
  async function newCaptcha(keepError = false) {
    if (!keepError) setError("");
    setAnswer("");
    setCaptcha(null);
    const result = await client.request<Captcha>("auth_challenge");
    setCaptcha(result);
  }
  async function start() {
    setBusy(true);
    setError("");
    try {
      if (!captcha || !answer.trim())
        throw new Error("Enter the characters from the security image.");
      if (mode === "signup" && password !== confirmation)
        throw new Error("Passwords do not match.");
      const result =
        mode === "login"
          ? await client.request<Pending>(
              "auth_start",
              {
                usr: user,
                pwd: password,
                captcha_id: captcha.id,
                captcha_answer: answer,
              },
              true,
            )
          : await client.request<Pending>(
              "auth_signup",
              {
                full_name: fullName,
                username: user,
                email,
                password,
                requested_role: role,
                company_name: company,
                role_details: details,
                captcha_id: captcha.id,
                captcha_answer: answer,
              },
              true,
            );
      setPending(result);
      setPassword("");
      setConfirmation("");
      setCode("");
      setAnswer("");
      setCaptcha(null);
    } catch (err) {
      setError(message(err));
      try {
        await newCaptcha(true);
      } catch {}
    } finally {
      setBusy(false);
    }
  }
  async function verify() {
    if (!pending) return;
    setBusy(true);
    setError("");
    try {
      const result = await login(pending.challenge, code);
      setPending(null);
      setCode("");
      if (result.recovery_codes.length) setCodes(result.recovery_codes);
      else await refresh();
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }
  const disabled = busy || sessionBusy;
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "white" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: 26,
          paddingTop: 44,
          paddingBottom: 40,
          gap: 24,
        }}
      >
        <Brand size={78} />
        <View style={{ gap: 8 }}>
          <Text
            accessibilityRole="header"
            style={[styles.title, { fontSize: 27 }]}
          >
            {codes.length
              ? "Save your recovery codes"
              : pending?.stage === "enroll"
                ? "Set up your authenticator"
                : pending
                  ? "Verify your sign-in"
                  : mode === "signup"
                    ? "Create your VORQ account"
                    : "Sign in to VORQ"}
          </Text>
          <Text style={styles.text}>
            {codes.length
              ? "Each code works once. Keep them somewhere safe outside this phone."
              : pending?.stage === "enroll"
                ? "Scan this QR with Google Authenticator, Microsoft Authenticator, or another TOTP app."
                : pending
                  ? "Enter the current code from your authenticator app."
                  : "One account for VORQ mobile and desktop."}
          </Text>
        </View>
        {checking ? (
          <ActivityIndicator color={colors.green} />
        ) : codes.length ? (
          <>
            <View style={styles.card}>
              {codes.map((value) => (
                <Text
                  selectable
                  key={value}
                  style={{
                    color: colors.ink,
                    fontSize: 14,
                    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
                  }}
                >
                  {value}
                </Text>
              ))}
            </View>
            <Text style={styles.error}>
              These codes will not be shown again. Anyone with a code and your
              password can sign in.
            </Text>
            <Button
              title="I saved these codes — continue"
              disabled={disabled}
              onPress={() => {
                setBusy(true);
                void refresh()
                  .then(() => setCodes([]))
                  .catch((err) => setError(message(err)))
                  .finally(() => setBusy(false));
              }}
            />
          </>
        ) : pending ? (
          <>
            {pending.stage === "enroll" ? (
              <>
                <View style={{ alignItems: "center", gap: 16 }}>
                  <Image
                    accessibilityLabel="Authenticator setup QR code"
                    source={{ uri: pending.qr_image }}
                    style={{ width: 250, height: 250 }}
                  />
                  <Text style={styles.label}>
                    Can’t scan? Enter this setup key in your authenticator.
                  </Text>
                  <Text
                    selectable
                    style={{
                      fontSize: 13,
                      color: colors.ink,
                      letterSpacing: 1,
                    }}
                  >
                    {pending.setup_key}
                  </Text>
                </View>
                <Text style={styles.text}>
                  Setup expires after 5 minutes. Scanning alone does not enable
                  TOTP; confirm a code below.
                </Text>
              </>
            ) : null}
            <AuthField
              label={recovery ? "Recovery code" : "6-digit authenticator code"}
              value={code}
              onChange={setCode}
              disabled={disabled}
            />
            {pending.stage === "totp" ? (
              <Button
                secondary
                title={
                  recovery ? "Use authenticator instead" : "Use a recovery code"
                }
                disabled={disabled}
                onPress={() => {
                  setRecovery(!recovery);
                  setCode("");
                }}
              />
            ) : null}
            <Button
              title={
                disabled
                  ? "Verifying…"
                  : pending.stage === "enroll"
                    ? "Confirm and enable TOTP"
                    : "Verify and sign in"
              }
              disabled={disabled || !code.trim()}
              onPress={() => {
                void verify();
              }}
            />
            <Button
              secondary
              title="Start again"
              disabled={disabled}
              onPress={() => {
                setPending(null);
                setCode("");
                setRecovery(false);
                setError("");
                void newCaptcha().catch((err) => setError(message(err)));
              }}
            />
          </>
        ) : (
          <>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {(["login", "signup"] as const).map((value) => (
                <View key={value} style={{ flex: 1 }}>
                  <Button
                    title={value === "login" ? "Sign in" : "Create account"}
                    secondary={mode !== value}
                    disabled={disabled}
                    onPress={() => {
                      setMode(value);
                      setPassword("");
                      setConfirmation("");
                      setError("");
                    }}
                  />
                </View>
              ))}
            </View>
            {mode === "signup" ? (
              <>
                <AuthField
                  label="Full name"
                  value={fullName}
                  onChange={setFullName}
                  disabled={disabled}
                />
                <AuthField
                  label="Email address"
                  value={email}
                  onChange={setEmail}
                  email
                  disabled={disabled}
                />
              </>
            ) : null}
            <AuthField
              label={mode === "signup" ? "Username" : "Email or username"}
              value={user}
              onChange={setUser}
              disabled={disabled}
            />
            <AuthField
              label="Password"
              value={password}
              onChange={setPassword}
              secure
              disabled={disabled}
            />
            {mode === "signup" ? (
              <>
                <Text style={styles.text}>
                  Use 12–128 characters and a long, unique passphrase.
                  Predictable passwords are rejected.
                </Text>
                <AuthField
                  label="Confirm password"
                  value={confirmation}
                  onChange={setConfirmation}
                  secure
                  disabled={disabled}
                />
                <AuthField
                  label="Company / organisation"
                  value={company}
                  onChange={setCompany}
                  disabled={disabled}
                />
                <View style={{ gap: 8 }}>
                  <Text style={styles.label}>Requested role</Text>
                  <Button
                    title={role || "Choose your role"}
                    secondary
                    disabled={disabled}
                    onPress={() => setRolesOpen(!rolesOpen)}
                  />
                  {rolesOpen
                    ? Object.keys(captcha?.roles || {}).map((value) => (
                        <Pressable
                          key={value}
                          accessibilityRole="radio"
                          accessibilityState={{ checked: role === value }}
                          onPress={() => {
                            setRole(value);
                            setDetails({});
                            setRolesOpen(false);
                          }}
                          style={{
                            padding: 14,
                            borderBottomWidth: 1,
                            borderBottomColor: colors.border,
                          }}
                        >
                          <Text style={{ color: colors.ink }}>{value}</Text>
                        </Pressable>
                      ))
                    : null}
                </View>
                {(captcha?.roles[role] || []).map((field) => (
                  <AuthField
                    key={field.name}
                    label={field.label}
                    value={details[field.name] || ""}
                    onChange={(value) =>
                      setDetails((current) => ({
                        ...current,
                        [field.name]: value,
                      }))
                    }
                    disabled={disabled}
                  />
                ))}
                <Text style={styles.text}>
                  Your role request does not grant access. An administrator must
                  verify your identity and assign company, project and ERP
                  permissions.
                </Text>
              </>
            ) : null}
            <View style={{ gap: 12 }}>
              <Text style={styles.label}>Security image</Text>
              {captcha ? (
                <Image
                  accessibilityLabel="Security image: enter the six displayed characters"
                  source={{ uri: captcha.image }}
                  style={{
                    width: "100%",
                    height: 110,
                    resizeMode: "contain",
                    backgroundColor: "#F1F4FA",
                  }}
                />
              ) : (
                <ActivityIndicator color={colors.green} />
              )}
              <Button
                secondary
                title="Refresh security image"
                disabled={disabled}
                onPress={() => {
                  void newCaptcha().catch((err) => setError(message(err)));
                }}
              />
              <AuthField
                label="Characters from security image"
                value={answer}
                onChange={setAnswer}
                disabled={disabled}
              />
              <Text style={styles.text}>
                The image expires after 2 minutes and can be used once.
              </Text>
            </View>
            <Button
              title={
                disabled
                  ? "Please wait…"
                  : mode === "signup"
                    ? "Create account and set up TOTP"
                    : "Continue to authenticator"
              }
              disabled={
                disabled ||
                !captcha ||
                !user.trim() ||
                !password ||
                !answer.trim() ||
                (mode === "signup" &&
                  (!fullName || !email || !company || !role))
              }
              onPress={() => {
                void start();
              }}
            />
          </>
        )}
        {error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : null}
        <Text style={{ color: colors.muted, fontSize: 10, letterSpacing: 1.4 }}>
          VORQ · CONSTRUCTION OPERATIONS
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
