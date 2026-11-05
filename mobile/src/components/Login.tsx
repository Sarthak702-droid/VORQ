import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useWorkspace } from "../state/Workspace";
import { Brand } from "./Brand";
import { Button, colors, styles } from "./ui";
export function Login() {
  const { login, checking, busy, error, refresh } = useWorkspace();
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  async function submit() {
    try {
      await login(user, password);
    } finally {
      setPassword("");
    }
  }
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "white" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          padding: 28,
          paddingTop: 72,
          justifyContent: "center",
        }}
      >
        <View style={{ gap: 30 }}>
          <Brand size={96} />
          <View style={{ gap: 10 }}>
            <Text
              style={{
                color: colors.ink,
                fontSize: 30,
                fontWeight: "700",
                letterSpacing: -1,
              }}
            >
              Welcome to VORQ
            </Text>
            <Text style={styles.text}>
              Sign in to your construction workspace.
            </Text>
          </View>
          {checking ? (
            <ActivityIndicator
              color={colors.green}
              accessibilityLabel="Checking your VORQ session"
            />
          ) : (
            <>
              <View style={{ gap: 18 }}>
                <View style={{ gap: 8 }}>
                  <Text style={styles.label}>Email or username</Text>
                  <TextInput
                    accessibilityLabel="Email or username"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="username"
                    textContentType="username"
                    editable={!busy}
                    style={styles.input}
                    value={user}
                    onChangeText={setUser}
                    placeholder="you@company.com"
                    placeholderTextColor={colors.muted}
                  />
                </View>
                <View style={{ gap: 8 }}>
                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    accessibilityLabel="Password"
                    secureTextEntry
                    autoComplete="current-password"
                    textContentType="password"
                    editable={!busy}
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    onSubmitEditing={() => {
                      if (user.trim() && password && !busy)
                        void submit().catch(() => {});
                    }}
                    placeholder="Enter your password"
                    placeholderTextColor={colors.muted}
                  />
                </View>
              </View>
              {error ? (
                <Text accessibilityRole="alert" style={styles.error}>
                  {error}
                </Text>
              ) : null}
              <Button
                title={busy ? "Signing in…" : "Sign in"}
                disabled={busy || !user.trim() || !password}
                onPress={() => {
                  void submit().catch(() => {});
                }}
              />
              {error ? (
                <Button
                  title="Try connection again"
                  secondary
                  disabled={busy}
                  onPress={() => {
                    void refresh().catch(() => {});
                  }}
                />
              ) : null}
              <Text style={[styles.text, { fontSize: 12 }]}>
                Use the same account as VORQ on desktop. Your company
                administrator controls access to projects and financial records.
              </Text>
            </>
          )}
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: colors.border,
              paddingTop: 20,
            }}
          >
            <Text
              style={{ color: colors.muted, fontSize: 10, letterSpacing: 1.8 }}
            >
              VORQ · CONSTRUCTION OPERATIONS
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
