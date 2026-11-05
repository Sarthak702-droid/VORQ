import { useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useWorkspace } from "../state/Workspace";
import { Icon, type IconName } from "./Icon";
import { Brand } from "./Brand";
export const colors = {
  ink: "#20263C",
  muted: "#6F768B",
  green: "#2454A6",
  pale: "#EBF1FA",
  paper: "#F5F6F8",
  border: "#E9EBF2",
  amber: "#A76927",
};
export const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper },
  content: {
    paddingHorizontal: 22,
    paddingTop: 22,
    gap: 20,
    paddingBottom: 32,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.6,
    color: colors.muted,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.9,
  },
  heading: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: -0.3,
  },
  text: { fontSize: 13, lineHeight: 21, color: colors.muted },
  card: {
    padding: 18,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "white",
    gap: 14,
  },
  row: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 13,
    color: colors.ink,
    fontSize: 14,
    backgroundColor: "#FAFBFE",
    minHeight: 50,
  },
  label: { color: "#555E76", fontSize: 12, fontWeight: "600" },
  error: { color: "#B74646", fontSize: 13, lineHeight: 21 },
  badge: {
    color: colors.green,
    fontWeight: "700",
    fontSize: 10,
    letterSpacing: 0.6,
  },
  between: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
});
export function Page({
  title,
  subtitle,
  children,
  eyebrow,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  eyebrow?: string;
}) {
  const {
    session,
    workspace,
    company,
    checking,
    busy,
    error,
    refresh,
    selectCompany,
    logout,
  } = useWorkspace();
  const [info, setInfo] = useState(false);
  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={{
          paddingHorizontal: 22,
          paddingVertical: 15,
          backgroundColor: "white",
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View style={styles.between}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Brand size={46} />
            <Text
              style={{
                color: colors.ink,
                fontSize: 20,
                fontWeight: "800",
                letterSpacing: 1.5,
              }}
            >
              VORQ
            </Text>
          </View>
          <View style={styles.row}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Refresh VORQ data"
              disabled={busy}
              onPress={() => {
                void refresh().catch(() => {});
              }}
              style={{ padding: 12 }}
            >
              <Icon name="refresh" size={18} color={colors.muted} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Account and company settings"
              onPress={() => setInfo(true)}
              style={{
                height: 38,
                width: 38,
                borderRadius: 19,
                backgroundColor: "#E8EDF3",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{ fontSize: 12, fontWeight: "700", color: colors.ink }}
              >
                {(session?.full_name || session?.user || "V")
                  .split(" ")
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: 8 }}>
          <Text style={styles.eyebrow}>
            {eyebrow || company || "WORKSPACE ACCESS"}
          </Text>
          <Text accessibilityRole="header" style={styles.title}>
            {title}
          </Text>
          <Text style={styles.text}>{subtitle}</Text>
        </View>
        {error ? (
          <View style={styles.card}>
            <Text accessibilityRole="alert" style={styles.error}>
              {error}
            </Text>
            <Button
              secondary
              title="Retry connection"
              onPress={() => {
                void refresh().catch(() => {});
              }}
            />
          </View>
        ) : null}
        {checking || (company && !workspace && busy) ? (
          <ActivityIndicator color={colors.green} />
        ) : (
          children
        )}
      </ScrollView>
      <Modal
        visible={info}
        transparent
        animationType="fade"
        onRequestClose={() => setInfo(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "#17213A70",
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}
        >
          <View
            style={[
              styles.card,
              { maxWidth: 380, width: "100%", padding: 24, gap: 18 },
            ]}
          >
            <Brand size={52} />
            <Text style={styles.heading}>
              {session?.full_name || session?.user}
            </Text>
            <Text style={styles.text}>
              {session?.user} · {workspace?.role || "Access pending"}
            </Text>
            <Text style={styles.label}>Company</Text>
            {session?.companies.map((name) => (
              <Button
                key={name}
                secondary={name !== company}
                disabled={busy}
                title={name}
                onPress={() => {
                  void selectCompany(name)
                    .then(() => setInfo(false))
                    .catch(() => {});
                }}
              />
            ))}
            <Button
              title="Sign out"
              icon="logout"
              secondary
              disabled={busy}
              onPress={() => {
                void logout();
              }}
            />
            <Button title="Close" onPress={() => setInfo(false)} />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

export function Button({
  title,
  onPress,
  secondary = false,
  disabled = false,
  icon,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  icon?: IconName;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 48,
        paddingHorizontal: 16,
        paddingVertical: 13,
        borderRadius: 9,
        backgroundColor: secondary ? colors.pale : colors.green,
        opacity: disabled ? 0.4 : pressed ? 0.75 : 1,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",
        gap: 8,
      })}
    >
      {icon ? (
        <Icon
          name={icon}
          size={18}
          color={secondary ? colors.green : "white"}
        />
      ) : null}
      <Text
        style={{
          color: secondary ? colors.green : "white",
          fontWeight: "700",
          fontSize: 13,
          textAlign: "center",
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function Field({
  label,
  value,
  onChangeText,
  numeric,
  multiline,
  placeholder,
  visibleLabel,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  numeric?: boolean;
  multiline?: boolean;
  placeholder?: string;
  visibleLabel?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.label}>{visibleLabel || label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || (numeric ? "0.00" : "Enter details")}
        placeholderTextColor="#A3A8B9"
        keyboardType={numeric ? "decimal-pad" : "default"}
        multiline={multiline}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        selectionColor={colors.green}
        style={[
          styles.input,
          focused
            ? { borderColor: colors.green, backgroundColor: "white" }
            : undefined,
          multiline ? { minHeight: 96, textAlignVertical: "top" } : undefined,
        ]}
      />
    </View>
  );
}
export function ProjectPicker() {
  const { workspace, project, selectProject } = useWorkspace();
  const [expanded, setExpanded] = useState(false);
  const selected = workspace?.projects.find((item) => item.name === project);
  return (
    <View style={{ gap: 8 }}>
      {!workspace?.projects.length ? (
        <View style={styles.card}>
          <Text style={styles.text}>
            No assigned projects. Add a project if your account has permission,
            or contact your administrator.
          </Text>
        </View>
      ) : (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Choose project"
            accessibilityState={{ expanded }}
            onPress={() => setExpanded(!expanded)}
            style={[
              styles.card,
              {
                padding: 14,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
              },
            ]}
          >
            <Icon name="projects" size={21} color={colors.muted} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.eyebrow}>PROJECT</Text>
              <Text
                style={[styles.label, { color: colors.ink }]}
                numberOfLines={1}
              >
                {selected?.project_name || "Choose a project"}
              </Text>
            </View>
            <Icon name="down" size={16} color={colors.muted} />
          </Pressable>
          {expanded ? (
            <View style={styles.card}>
              {workspace.projects.map((item) => (
                <Pressable
                  key={item.name}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: item.name === project }}
                  onPress={() => {
                    selectProject(item.name);
                    setExpanded(false);
                  }}
                  style={{
                    paddingVertical: 12,
                    flexDirection: "row",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>{item.project_name}</Text>
                    <Text style={styles.text}>{item.name}</Text>
                  </View>
                  {item.name === project ? (
                    <Icon name="check" size={18} />
                  ) : null}
                </Pressable>
              ))}
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}
export function IconBox({
  name,
  color = colors.green,
  background = colors.pale,
  size = 42,
}: {
  name: IconName;
  color?: string;
  background?: string;
  size?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 9,
        backgroundColor: background,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon name={name} color={color} size={size * 0.48} />
    </View>
  );
}
export function EmptyState({
  title,
  description,
  icon = "bill",
}: {
  title: string;
  description: string;
  icon?: IconName;
}) {
  return (
    <View
      style={[
        styles.card,
        { alignItems: "center", paddingVertical: 28, gap: 10 },
      ]}
    >
      <IconBox name={icon} size={52} />
      <Text style={styles.heading}>{title}</Text>
      <Text style={[styles.text, { textAlign: "center", maxWidth: 280 }]}>
        {description}
      </Text>
    </View>
  );
}
export function Section({
  title,
  action,
  onPress,
}: {
  title: string;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.between}>
      <Text style={styles.heading}>{title}</Text>
      {action && onPress ? (
        <Pressable
          accessibilityRole="button"
          onPress={onPress}
          hitSlop={8}
          style={{ minHeight: 44, justifyContent: "center" }}
        >
          <Text
            style={{ fontSize: 12, color: colors.green, fontWeight: "600" }}
          >
            {action} →
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
export function Feedback({ text }: { text: string }) {
  return text ? (
    <View style={{ backgroundColor: "#F0F1FA", padding: 13, borderRadius: 10 }}>
      <Text
        accessibilityRole="alert"
        style={[styles.text, { color: colors.ink }]}
      >
        {text}
      </Text>
    </View>
  ) : null;
}
export function message(error: unknown) {
  return error instanceof Error
    ? error.message
    : "The record could not be saved. Please retry.";
}
