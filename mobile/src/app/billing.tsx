import { useState } from "react";
import { Share, Text, View } from "react-native";
import {
  Button,
  Feedback,
  Field,
  message,
  Page,
  ProjectPicker,
  styles,
} from "../components/ui";
import {
  billSummary,
  localDate,
  money,
  totals,
  validDate,
  type BillKind,
  type BillLine,
} from "../domain/records";
import { useWorkspace } from "../state/Workspace";
const newLine = (): BillLine => ({
  description: "",
  unit: "sqm",
  quantity: "",
  rate: "",
});
export default function Billing() {
  const { data, change, busy } = useWorkspace();
  const [projectId, setProjectId] = useState("");
  const selectedProject = projectId || data.projects[0]?.id || "";
  const [kind, setKind] = useState<BillKind>("Client claim");
  const [party, setParty] = useState("");
  const [date, setDate] = useState(localDate);
  const [reference, setReference] = useState("");
  const [lines, setLines] = useState<BillLine[]>([newLine()]);
  const [deduction, setDeduction] = useState("0");
  const [notes, setNotes] = useState("");
  const [feedback, setFeedback] = useState("");
  const [confirmDelete, setConfirmDelete] = useState("");
  let preview = "";
  try {
    preview = money(totals(lines, deduction).net);
  } catch {
    /* Show total once all items are valid. */
  }
  function editLine(index: number, field: keyof BillLine, value: string) {
    setLines((current) =>
      current.map((line, i) =>
        i === index ? { ...line, [field]: value } : line,
      ),
    );
  }
  async function save() {
    try {
      if (!selectedProject || !party.trim())
        throw new Error(
          "Choose a project and enter the client, subcontractor or vendor name.",
        );
      if (!validDate(date))
        throw new Error("Enter a valid date as YYYY-MM-DD.");
      totals(lines, deduction);
      await change((store) => ({
        ...store,
        bills: [
          {
            id: `draft-${Date.now()}`,
            projectId: selectedProject,
            kind,
            party: party.trim(),
            reference: reference.trim(),
            date,
            lines: lines.map((line) => ({
              ...line,
              description: line.description.trim(),
            })),
            deduction,
            notes: notes.trim(),
            createdAt: new Date().toISOString(),
          },
          ...store.bills,
        ],
      }));
      setParty("");
      setReference("");
      setLines([newLine()]);
      setDeduction("0");
      setNotes("");
      setFeedback(
        "Draft saved on this device. It has not been submitted or posted.",
      );
    } catch (error) {
      setFeedback(message(error));
    }
  }
  async function remove(id: string) {
    try {
      await change((store) => ({
        ...store,
        bills: store.bills.filter((b) => b.id !== id),
      }));
      setConfirmDelete("");
    } catch (error) {
      setFeedback(message(error));
    }
  }
  return (
    <Page
      title="Bill the work."
      subtitle="Measured work, clear deductions, and a draft your accountant can review."
    >
      <ProjectPicker value={selectedProject} onChange={setProjectId} />
      <View style={styles.card}>
        <Text style={styles.heading}>New billing draft</Text>
        <Text style={styles.label}>Record type</Text>
        <View style={styles.row}>
          {(["Client claim", "Subcontract bill", "Site expense"] as const).map(
            (option) => (
              <Button
                key={option}
                title={`${kind === option ? "● " : ""}${option}`}
                secondary={kind !== option}
                onPress={() => setKind(option)}
              />
            ),
          )}
        </View>
        <Field label="Party name" value={party} onChangeText={setParty} />
        <Field label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} />
        <Field
          label="Measurement / receipt reference (optional)"
          value={reference}
          onChangeText={setReference}
        />
        {lines.map((line, index) => (
          <View
            key={index}
            style={[styles.card, { backgroundColor: "#F5F6F0", padding: 14 }]}
          >
            <Text style={styles.label}>ITEM {index + 1}</Text>
            <Field
              label={`Item ${index + 1} description`}
              value={line.description}
              onChangeText={(v) => editLine(index, "description", v)}
              placeholder="e.g. First-floor brickwork"
            />
            <Field
              label={`Item ${index + 1} unit`}
              value={line.unit}
              onChangeText={(v) => editLine(index, "unit", v)}
            />
            <Field
              label={`Item ${index + 1} quantity`}
              value={line.quantity}
              numeric
              onChangeText={(v) => editLine(index, "quantity", v)}
            />
            <Field
              label={`Item ${index + 1} rate (₹ per unit)`}
              value={line.rate}
              numeric
              onChangeText={(v) => editLine(index, "rate", v)}
            />
            {lines.length > 1 ? (
              <Button
                secondary
                title="Remove item"
                onPress={() =>
                  setLines((current) => current.filter((_, i) => i !== index))
                }
              />
            ) : null}
          </View>
        ))}
        <Button
          title="+ Add work item"
          secondary
          onPress={() => setLines((current) => [...current, newLine()])}
        />
        <Field
          label="Total deductions (₹)"
          value={deduction}
          numeric
          onChangeText={setDeduction}
        />
        <Field
          label="Deduction breakdown / notes (optional)"
          value={notes}
          onChangeText={setNotes}
          multiline
          placeholder="Record retention, advance recovery or receipt details."
        />
        <Text style={styles.heading}>
          {preview
            ? `Draft amount ${preview}`
            : "Complete work items to see the total."}
        </Text>
        <Text style={styles.text}>
          Tax is not calculated. This draft needs measurement certification and
          finance review before invoicing or payment.
        </Text>
        <Button
          title={busy ? "Saving…" : "Save local draft"}
          disabled={busy || !selectedProject}
          onPress={save}
        />
        <Feedback text={feedback} />
      </View>
      <Text style={styles.heading}>Saved drafts · selected project</Text>
      {data.bills
        .filter((b) => b.projectId === selectedProject)
        .map((bill) => (
          <View key={bill.id} style={styles.card}>
            <Text style={styles.badge}>
              {bill.kind.toUpperCase()} · LOCAL DRAFT
            </Text>
            <Text style={styles.heading}>{bill.party}</Text>
            <Text style={styles.text}>
              {bill.date} · {bill.reference || bill.id}
            </Text>
            {bill.lines.map((line, index) => (
              <Text key={index} style={styles.text}>
                {line.description} · {line.quantity} {line.unit} × ₹{line.rate}
              </Text>
            ))}
            <Text style={styles.heading}>
              {money(totals(bill.lines, bill.deduction).net)}
            </Text>
            <Button
              secondary
              title="Share draft summary"
              onPress={async () => {
                try {
                  await Share.share({
                    message: billSummary(
                      bill,
                      data.projects.find((p) => p.id === bill.projectId)!,
                    ),
                  });
                } catch (error) {
                  setFeedback(message(error));
                }
              }}
            />
            {confirmDelete === bill.id ? (
              <>
                <Text style={styles.error}>
                  Delete this device draft permanently?
                </Text>
                <Button
                  title="Confirm delete"
                  disabled={busy}
                  onPress={() => remove(bill.id)}
                />
                <Button
                  title="Keep draft"
                  secondary
                  onPress={() => setConfirmDelete("")}
                />
              </>
            ) : (
              <Button
                title="Delete draft"
                secondary
                onPress={() => setConfirmDelete(bill.id)}
              />
            )}
          </View>
        ))}
      {!data.bills.some((b) => b.projectId === selectedProject) ? (
        <Text style={styles.text}>No billing drafts for this project yet.</Text>
      ) : null}
    </Page>
  );
}
