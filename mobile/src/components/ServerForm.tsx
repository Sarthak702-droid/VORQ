import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";
import { client } from "../api/runtime";
import { fieldDefaults, type Field as ServerField } from "../api/contracts";
import { useWorkspace } from "../state/Workspace";
import { Button, colors, Field, message, styles } from "./ui";
import { Icon } from "./Icon";
type Values = Record<string, unknown>;
export function validateValues(fields: ServerField[], values: Values) {
  for (const field of fields) {
    const value = values[field.name];
    if (
      field.required &&
      (value === undefined ||
        value === null ||
        value === "" ||
        (Array.isArray(value) && !value.length))
    )
      throw new Error(`${field.label} is required.`);
    if (field.type === "Table") {
      for (const row of (value || []) as Values[])
        validateValues(field.children || [], row);
    }
    if (
      ["Int", "Float", "Currency", "Percent"].includes(field.type) &&
      value !== undefined &&
      value !== ""
    ) {
      if (
        !Number.isFinite(Number(value)) ||
        (field.type === "Int" && !Number.isInteger(Number(value)))
      )
        throw new Error(`${field.label} must be a valid number.`);
    }
    if (field.type === "Date" && value) {
      const date = String(value);
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        Number.isNaN(Date.parse(date)) ||
        new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) !== date
      )
        throw new Error(`${field.label}: use YYYY-MM-DD.`);
    }
  }
}
export function ServerForm({
  fields,
  values,
  onChange,
  disabled = false,
}: {
  fields: ServerField[];
  values: Values;
  onChange: (values: Values) => void;
  disabled?: boolean;
}) {
  const [showAdditional, setShowAdditional] = useState(false);
  const primary = new Set([
    "project_name",
    "customer",
    "supplier",
    "posting_date",
    "due_date",
    "date",
    "report_date",
    "weather",
    "progress_notes",
    "blockers",
    "status",
    "items",
    "entries",
    "lines",
    "employee",
    "attendance_date",
    "wage_rate",
    "item_code",
    "description",
    "qty",
    "quantity",
    "uom",
    "rate",
    "cost_center",
    "work_order",
    "this_period_qty",
    "account",
    "debit_in_account_currency",
    "credit_in_account_currency",
  ]);
  const additional = fields.filter(
    (field) => !field.required && !primary.has(field.name),
  );
  const visible =
    disabled || showAdditional
      ? fields
      : fields.filter((field) => field.required || primary.has(field.name));
  const change = (name: string, value: unknown) =>
    onChange({ ...values, [name]: value });
  return (
    <View style={{ gap: 17 }}>
      {visible.map((field) => {
        if (field.type === "Table") {
          const rows = (values[field.name] || []) as Values[];
          return (
            <View key={field.name} style={{ gap: 14 }}>
              <Text style={styles.heading}>
                {field.label}
                {field.required ? " *" : ""}
              </Text>
              {rows.map((row, index) => (
                <View
                  key={index}
                  style={[styles.card, { backgroundColor: colors.paper }]}
                >
                  <View style={styles.between}>
                    <Text style={styles.label}>LINE {index + 1}</Text>
                    {!disabled ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${field.label} line ${index + 1}`}
                        onPress={() =>
                          change(
                            field.name,
                            rows.filter((_, i) => i !== index),
                          )
                        }
                        style={{ padding: 10 }}
                      >
                        <Icon name="trash" size={17} color={colors.muted} />
                      </Pressable>
                    ) : null}
                  </View>
                  <ServerForm
                    fields={field.children || []}
                    values={row}
                    disabled={disabled}
                    onChange={(next) =>
                      change(
                        field.name,
                        rows.map((item, i) => (i === index ? next : item)),
                      )
                    }
                  />
                </View>
              ))}
              {!disabled ? (
                <Button
                  title={`Add ${field.label.toLowerCase()} line`}
                  icon="plus"
                  secondary
                  onPress={() =>
                    change(field.name, [
                      ...rows,
                      fieldDefaults(field.children || []),
                    ])
                  }
                />
              ) : null}
            </View>
          );
        }
        if (disabled)
          return (
            <View key={field.name} style={{ gap: 5 }}>
              <Text style={styles.label}>{field.label}</Text>
              <Text selectable style={[styles.text, { color: colors.ink }]}>
                {String(values[field.name] ?? "—").replace(/<[^>]*>/g, "")}
              </Text>
            </View>
          );
        if (field.type === "Link" || field.type === "Select")
          return (
            <PickerField
              key={field.name}
              field={field}
              value={String(values[field.name] || "")}
              onChange={(value) => change(field.name, value)}
            />
          );
        if (field.type === "Check")
          return (
            <View key={field.name} style={styles.between}>
              <Text style={styles.label}>{field.label}</Text>
              <Switch
                accessibilityLabel={field.label}
                value={Boolean(Number(values[field.name] || 0))}
                onValueChange={(value) => change(field.name, value ? 1 : 0)}
                trackColor={{ true: colors.green }}
              />
            </View>
          );
        return (
          <Field
            key={field.name}
            label={`${field.label}${field.required ? " *" : ""}`}
            value={String(values[field.name] ?? "")}
            onChangeText={(value) => change(field.name, value)}
            numeric={["Int", "Float", "Currency", "Percent"].includes(
              field.type,
            )}
            multiline={[
              "Text",
              "Small Text",
              "Text Editor",
              "Long Text",
              "Code",
            ].includes(field.type)}
            placeholder={field.type === "Date" ? "YYYY-MM-DD" : undefined}
          />
        );
      })}
      {!disabled && additional.length ? (
        <Button
          title={
            showAdditional
              ? "Fewer fields"
              : `Additional fields (${additional.length})`
          }
          secondary
          onPress={() => setShowAdditional((value) => !value)}
        />
      ) : null}
    </View>
  );
}
function PickerField({
  field,
  value,
  onChange,
}: {
  field: ServerField;
  value: string;
  onChange: (value: string) => void;
}) {
  const { company, project } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const generation = useRef(0);
  useEffect(() => {
    if (!open) return;
    const stamp = ++generation.current;
    let cancelled = false;
    if (field.type === "Select") return;
    const timer = setTimeout(() => {
      setLoading(true);
      setError("");
      client
        .request<string[]>("lookup", {
          doctype: field.options,
          company,
          project,
          query,
        })
        .then((items) => {
          if (!cancelled && stamp === generation.current) setOptions(items);
        })
        .catch((err) => {
          if (!cancelled && stamp === generation.current)
            setError(message(err));
        })
        .finally(() => {
          if (!cancelled && stamp === generation.current) setLoading(false);
        });
    }, 200);
    return () => {
      clearTimeout(timer);
      cancelled = true;
    };
  }, [open, query, company, project, field.options, field.type]);
  const available =
    field.type === "Select"
      ? (field.options || "")
          .split("\n")
          .filter(Boolean)
          .filter((option) =>
            option.toLowerCase().includes(query.toLowerCase()),
          )
      : options;
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.label}>
        {field.label}
        {field.required ? " *" : ""}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Select ${field.label}`}
        onPress={() => {
          setQuery("");
          setOptions([]);
          setError("");
          setOpen(true);
        }}
        style={[styles.input, styles.between]}
      >
        <Text
          style={{
            flex: 1,
            fontSize: 14,
            color: value ? colors.ink : colors.muted,
          }}
          numberOfLines={2}
        >
          {value || `Select ${field.label.toLowerCase()}`}
        </Text>
        <Icon name="down" size={16} color={colors.muted} />
      </Pressable>
      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "#17213A70",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 480,
              maxHeight: "85%",
              minHeight: 380,
              backgroundColor: "white",
              padding: 22,
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
              gap: 16,
            }}
          >
            <View style={styles.between}>
              <Text style={styles.heading}>{field.label}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close selection"
                onPress={() => setOpen(false)}
                style={{ padding: 12 }}
              >
                <Icon name="close" size={20} />
              </Pressable>
            </View>
            <Field
              label="Search"
              value={query}
              onChangeText={setQuery}
              placeholder="Search records"
            />
            {loading ? <ActivityIndicator color={colors.green} /> : null}
            {error ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {error}
              </Text>
            ) : null}
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 24 }}
            >
              {!field.required ? (
                <Button
                  secondary
                  title="Clear selection"
                  onPress={() => {
                    onChange("");
                    setOpen(false);
                  }}
                />
              ) : null}
              {available.map((option) => (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  onPress={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                  style={{
                    paddingVertical: 17,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <Text style={{ flex: 1, color: colors.ink, fontSize: 14 }}>
                    {option}
                  </Text>
                  {value === option ? <Icon name="check" size={18} /> : null}
                </Pressable>
              ))}
              {!loading && !available.length ? (
                <Text style={[styles.text, { paddingVertical: 20 }]}>
                  No matching records. Add the required master record in VORQ
                  desktop, then search again.
                </Text>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
