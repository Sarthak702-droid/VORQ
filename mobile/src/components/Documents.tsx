import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { randomUUID } from "expo-crypto";
import { client } from "../api/runtime";
import {
  displayValue,
  documentState,
  fieldDefaults,
  formatAmount,
  recordTitle,
  type RecordDetail,
  type RecordPage,
  type RecordRow,
} from "../api/contracts";
import { useWorkspace } from "../state/Workspace";
import { ServerForm, validateValues } from "./ServerForm";
import { Button, colors, EmptyState, Feedback, message, styles } from "./ui";
import { Icon } from "./Icon";
export function Documents({
  module,
  startCreating = false,
  onCreated,
}: {
  module: string;
  startCreating?: boolean;
  onCreated?: () => void;
}) {
  const { workspace, company, project, refresh } = useWorkspace();
  const capability = workspace?.modules.find((item) => item.id === module);
  const [page, setPage] = useState<RecordPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<RecordDetail | null>(null);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [action, setAction] = useState("");
  const active = useRef(true);
  const generation = useRef(0);
  const lock = useRef(false);
  const operation = useRef({ body: "", key: "" });
  const openedParam = useRef(false);
  const scope = {
    module,
    company,
    project: module === "projects" ? "" : project,
  };
  useEffect(() => {
    active.current = true;
    if (!startCreating) openedParam.current = false;
    let cancelled = false;
    const stamp = ++generation.current;
    client
      .request<RecordPage>("records", {
        module,
        company,
        project: module === "projects" ? "" : project,
      })
      .then((result) => {
        if (cancelled || !active.current || stamp !== generation.current)
          return;
        setPage(result);
        if (startCreating && capability?.can_create && !openedParam.current) {
          openedParam.current = true;
          setEditing({ name: "", modified: "", docstatus: 0, values: {} });
          setValues(fieldDefaults(result.fields));
        }
      })
      .catch((err) => {
        if (!cancelled && active.current && stamp === generation.current)
          setError(message(err));
      })
      .finally(() => {
        if (!cancelled && active.current && stamp === generation.current)
          setLoading(false);
      });
    return () => {
      cancelled = true;
      active.current = false;
    };
  }, [
    module,
    company,
    project,
    startCreating,
    capability?.can_create,
    workspace,
  ]);
  async function reload(append = false) {
    const stamp = ++generation.current;
    setLoading(true);
    setError("");
    try {
      const result = await client.request<RecordPage>("records", {
        ...scope,
        start: append ? page?.next_start : 0,
      });
      if (active.current && stamp === generation.current)
        setPage((previous) => ({
          ...result,
          records: append
            ? [...(previous?.records || []), ...result.records]
            : result.records,
        }));
    } catch (err) {
      if (active.current && stamp === generation.current)
        setError(message(err));
    } finally {
      if (active.current && stamp === generation.current) setLoading(false);
    }
  }
  async function open(row?: RecordRow) {
    setError("");
    setNotice("");
    setAction("");
    operation.current = { body: "", key: "" };
    if (!row) {
      setValues(fieldDefaults(page?.fields || []));
      setEditing({ name: "", modified: "", docstatus: 0, values: {} });
      return;
    }
    const stamp = ++generation.current;
    setLoading(true);
    try {
      const detail = await client.request<RecordDetail>("detail", {
        ...scope,
        name: row.name,
      });
      if (active.current && stamp === generation.current) {
        setEditing(detail);
        setValues(detail.values);
      }
    } catch (err) {
      if (active.current && stamp === generation.current)
        setError(message(err));
    } finally {
      if (active.current && stamp === generation.current) setLoading(false);
    }
  }
  function requestKey(body: Record<string, unknown>) {
    const serialized = JSON.stringify(body);
    if (operation.current.body !== serialized)
      operation.current = { body: serialized, key: randomUUID() };
    return operation.current.key;
  }
  async function save() {
    if (lock.current || !editing || !page) return;
    lock.current = true;
    setSaving(true);
    setError("");
    try {
      validateValues(page.fields, values);
      const body = {
        ...scope,
        values,
        ...(editing.name
          ? { name: editing.name, modified: editing.modified }
          : {}),
      };
      const result = await client.request<{ name: string; replayed: boolean }>(
        "save",
        { ...body, idempotency_key: requestKey(body) },
        true,
      );
      if (!active.current) return;
      setEditing(null);
      setNotice(
        `Saved to VORQ · ${result.name}${result.replayed ? " (existing request confirmed)" : ""}`,
      );
      await reload();
      if (module === "projects") await refresh();
      onCreated?.();
    } catch (err) {
      if (active.current) setError(message(err));
    } finally {
      lock.current = false;
      if (active.current) setSaving(false);
    }
  }
  async function transition() {
    if (lock.current || !editing?.name || !action) return;
    lock.current = true;
    setSaving(true);
    setError("");
    try {
      const body = {
        ...scope,
        name: editing.name,
        modified: editing.modified,
        action,
      };
      await client.request(
        "transition",
        { ...body, idempotency_key: requestKey(body) },
        true,
      );
      if (!active.current) return;
      setAction("");
      setEditing(null);
      setNotice(`${action} completed in VORQ.`);
      await reload();
    } catch (err) {
      if (active.current) setError(message(err));
    } finally {
      lock.current = false;
      if (active.current) setSaving(false);
    }
  }
  if (!capability)
    return (
      <EmptyState
        icon="shield"
        title="Access restricted"
        description="This module is not available for your VORQ account."
      />
    );
  const editable =
    capability.can_create &&
    editing?.docstatus === 0 &&
    !["Certified", "Approved"].includes(editing.state || "");
  return (
    <View style={{ gap: 16 }}>
      {error ? (
        <View style={styles.card}>
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
          <Button
            secondary
            title="Reload records"
            disabled={loading || saving}
            onPress={() => {
              void reload();
            }}
          />
        </View>
      ) : null}
      <Feedback text={notice} />
      {loading ? (
        <ActivityIndicator
          color={colors.green}
          accessibilityLabel="Loading VORQ records"
        />
      ) : null}
      {editing ? (
        <>
          <Button
            title="Back to records"
            secondary
            disabled={saving}
            onPress={() => {
              setEditing(null);
              setAction("");
              setError("");
              onCreated?.();
            }}
          />
          <View style={styles.card}>
            <View style={styles.between}>
              <Text style={[styles.heading, { flex: 1 }]}>
                {editing.name || "New record"}
              </Text>
              <Text style={styles.badge}>{documentState(editing)}</Text>
            </View>
            <ServerForm
              fields={page?.fields || []}
              values={values}
              disabled={!editable || saving}
              onChange={setValues}
            />
            {editing.computed && Object.entries(editing.computed).length ? (
              <View
                style={{
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                  paddingTop: 16,
                  gap: 12,
                }}
              >
                {Object.entries(editing.computed).map(([key, value]) => (
                  <View key={key} style={styles.between}>
                    <Text style={[styles.label, { flex: 1 }]}>
                      {key.replace(/_/g, " ")}
                    </Text>
                    <Text
                      selectable
                      style={[
                        styles.text,
                        { color: colors.ink, flex: 1, textAlign: "right" },
                      ]}
                    >
                      {displayValue(value)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
            {editable ? (
              <>
                <Text style={styles.text}>
                  Saved records follow your organisation’s review process.
                  Financial totals and taxes are calculated by VORQ.
                </Text>
                <Button
                  title={
                    saving
                      ? "Saving…"
                      : page?.submittable
                        ? "Save draft to VORQ"
                        : "Save to VORQ"
                  }
                  icon="check"
                  disabled={saving || loading}
                  onPress={() => {
                    void save();
                  }}
                />
              </>
            ) : null}
            {editing.actions?.map((name) => (
              <Button
                key={name}
                title={name}
                secondary
                disabled={saving || loading}
                onPress={() => setAction(name)}
              />
            ))}
            {action ? (
              <View style={[styles.card, { backgroundColor: "#FFF8EB" }]}>
                <Text style={styles.heading}>
                  Confirm {action.toLowerCase()}
                </Text>
                <Text style={styles.text}>
                  {editing.name} · {company}. This changes the server document
                  and may post accounting or stock entries according to the ERP
                  workflow.
                </Text>
                <Button
                  title={`Confirm ${action}`}
                  disabled={saving}
                  onPress={() => {
                    void transition();
                  }}
                />
                <Button
                  title="Keep current status"
                  secondary
                  disabled={saving}
                  onPress={() => setAction("")}
                />
              </View>
            ) : null}
          </View>
        </>
      ) : (
        <>
          <View style={styles.between}>
            <Text style={styles.heading}>
              {module === "projects" ? "Project records" : "Records"}{" "}
              <Text style={{ fontWeight: "400", color: colors.muted }}>
                ({page?.records.length || 0}
                {page?.next_start !== null && page?.next_start !== undefined
                  ? "+"
                  : ""}
                )
              </Text>
            </Text>
            {capability.can_create ? (
              <Button
                title="New"
                icon="plus"
                disabled={!page || loading}
                onPress={() => {
                  void open();
                }}
              />
            ) : null}
          </View>
          {page?.records.map((row) => (
            <Pressable
              key={row.name}
              accessibilityRole="button"
              accessibilityLabel={`Open ${row.name}`}
              onPress={() => {
                void open(row);
              }}
              style={({ pressed }) => [
                styles.card,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <View style={styles.between}>
                <Text
                  style={[
                    styles.badge,
                    { color: row.docstatus === 1 ? "#327657" : colors.muted },
                  ]}
                >
                  {documentState(row)}
                </Text>
                <Icon name="chevron" size={17} color={colors.muted} />
              </View>
              <Text style={styles.heading}>{recordTitle(row)}</Text>
              <Text style={styles.text}>{row.name}</Text>
              {row.posting_date || row.report_date || row.date ? (
                <Text style={styles.text}>
                  {displayValue(
                    row.posting_date || row.report_date || row.date,
                  )}
                </Text>
              ) : null}
              {row.grand_total !== undefined ? (
                <Text style={styles.heading}>
                  {formatAmount(row.grand_total)}
                </Text>
              ) : null}
            </Pressable>
          ))}
          {page && !page.records.length ? (
            <EmptyState
              icon={module === "projects" ? "projects" : "file"}
              title="No records yet"
              description={
                capability.can_create
                  ? "Create a record to save it directly in your VORQ workspace."
                  : "Records will appear here when available for your account and project."
              }
            />
          ) : null}
          {page?.next_start !== null && page?.next_start !== undefined ? (
            <Button
              title="Load more"
              secondary
              disabled={loading}
              onPress={() => {
                void reload(true);
              }}
            />
          ) : null}
        </>
      )}
    </View>
  );
}
