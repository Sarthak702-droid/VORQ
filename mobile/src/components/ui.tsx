import type { ReactNode } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useWorkspace } from "../state/Workspace";
export const colors = {
  ink: "#172B27",
  muted: "#63766F",
  green: "#146C50",
  pale: "#E7F1EB",
  paper: "#F5F6F0",
  border: "#DAE2D8",
  amber: "#83531D",
};
export const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper },
  content: {
    padding: 22,
    gap: 18,
    paddingBottom: 40,
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
    color: colors.green,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -1,
  },
  heading: { fontSize: 19, fontWeight: "700", color: colors.ink },
  text: { fontSize: 14, lineHeight: 22, color: colors.muted },
  card: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "white",
    gap: 12,
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
    borderRadius: 12,
    padding: 14,
    color: colors.ink,
    fontSize: 16,
    backgroundColor: "white",
    minHeight: 50,
  },
  label: { color: colors.ink, fontSize: 13, fontWeight: "600" },
  error: { color: "#AA3026", fontSize: 14, lineHeight: 22 },
  badge: {
    color: colors.amber,
    fontWeight: "700",
    fontSize: 11,
    letterSpacing: 0.7,
  },
});
export function Page({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const { ready, error } = useWorkspace();
  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.eyebrow}>VORQ / FIELD WORKSPACE</Text>
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        <Text style={styles.text}>{subtitle}</Text>
        <Text style={styles.badge}>
          LOCAL WORKSPACE · BACKEND NOT CONNECTED
        </Text>
        {error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : !ready ? (
          <ActivityIndicator
            accessibilityLabel="Loading saved records"
            color={colors.green}
          />
        ) : (
          children
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
export function Button({
  title,
  onPress,
  secondary = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 48,
        padding: 14,
        borderRadius: 12,
        backgroundColor: secondary ? colors.pale : colors.green,
        opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
        justifyContent: "center",
      })}
    >
      <Text
        style={{
          color: secondary ? colors.green : "white",
          fontWeight: "700",
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
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  numeric?: boolean;
  multiline?: boolean;
  placeholder?: string;
}) {
  return (
    <View style={{ gap: 7 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={numeric ? "decimal-pad" : "default"}
        multiline={multiline}
        style={[
          styles.input,
          multiline ? { minHeight: 100, textAlignVertical: "top" } : undefined,
        ]}
      />
    </View>
  );
}
export function ProjectPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const { data } = useWorkspace();
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.label}>Project</Text>
      {data.projects.length === 0 ? (
        <Text style={styles.text}>
          Add a project in the Projects tab first.
        </Text>
      ) : (
        data.projects.map((project) => (
          <Pressable
            key={project.id}
            accessibilityRole="radio"
            accessibilityState={{ checked: project.id === value }}
            onPress={() => onChange(project.id)}
            style={[
              styles.card,
              {
                padding: 14,
                backgroundColor: project.id === value ? colors.pale : "white",
              },
            ]}
          >
            <Text style={styles.label}>
              {project.id === value ? "● " : "○ "}
              {project.name}
            </Text>
          </Pressable>
        ))
      )}
    </View>
  );
}
export function Feedback({ text }: { text: string }) {
  return text ? (
    <Text accessibilityRole="alert" style={styles.text}>
      {text}
    </Text>
  ) : null;
}
export function message(error: unknown) {
  return error instanceof Error
    ? error.message
    : "The record could not be saved. Please retry.";
}
