import { useState } from "react";
import { Text, View } from "react-native";
import {
  Button,
  Feedback,
  Field,
  message,
  Page,
  ProjectPicker,
  styles,
} from "../components/ui";
import { localDate, validDate } from "../domain/records";
import { useWorkspace } from "../state/Workspace";
export default function Site() {
  const { data, change, busy } = useWorkspace();
  const [projectId, setProjectId] = useState("");
  const selectedProject = projectId || data.projects[0]?.id || "";
  const [date, setDate] = useState(localDate);
  const [workers, setWorkers] = useState("");
  const [work, setWork] = useState("");
  const [blockers, setBlockers] = useState("");
  const [feedback, setFeedback] = useState("");
  async function save() {
    try {
      if (!selectedProject || !work.trim())
        throw new Error("Choose a project and describe the work completed.");
      if (!validDate(date))
        throw new Error("Enter a valid date as YYYY-MM-DD.");
      if (!/^\d+$/.test(workers) || Number(workers) > 10000)
        throw new Error("Enter a whole worker count from 0 to 10000.");
      await change((store) => {
        if (
          store.siteRecords.some(
            (r) => r.projectId === selectedProject && r.date === date,
          )
        )
          throw new Error(
            "A site record already exists for this project and date.",
          );
        return {
          ...store,
          siteRecords: [
            {
              id: `site-${Date.now()}`,
              projectId: selectedProject,
              date,
              workers: Number(workers),
              work: work.trim(),
              blockers: blockers.trim(),
              createdAt: new Date().toISOString(),
            },
            ...store.siteRecords,
          ],
        };
      });
      setWorkers("");
      setWork("");
      setBlockers("");
      setFeedback("Site record saved on this device.");
    } catch (error) {
      setFeedback(message(error));
    }
  }
  return (
    <Page
      title="Keep the site story."
      subtitle="Record progress and labour while the details are fresh, even without internet."
    >
      <ProjectPicker value={selectedProject} onChange={setProjectId} />
      <View style={styles.card}>
        <Text style={styles.heading}>Daily site record</Text>
        <Field
          label="Site date (YYYY-MM-DD)"
          value={date}
          onChangeText={setDate}
        />
        <Field
          label="Workers on site"
          value={workers}
          numeric
          onChangeText={setWorkers}
        />
        <Field
          label="Work completed & material notes"
          value={work}
          multiline
          onChangeText={setWork}
          placeholder="Include measured quantities and units where possible."
        />
        <Field
          label="Blockers (optional)"
          value={blockers}
          multiline
          onChangeText={setBlockers}
        />
        <Button
          title={busy ? "Saving…" : "Save site record"}
          disabled={busy || !selectedProject}
          onPress={save}
        />
        <Feedback text={feedback} />
      </View>
      <Text style={styles.heading}>Site history · selected project</Text>
      {data.siteRecords
        .filter((r) => r.projectId === selectedProject)
        .map((record) => (
          <View key={record.id} style={styles.card}>
            <Text style={styles.badge}>LOCAL RECORD · {record.date}</Text>
            <Text style={styles.heading}>{record.workers} workers</Text>
            <Text style={styles.text}>{record.work}</Text>
            {record.blockers ? (
              <Text style={styles.error}>Blockers: {record.blockers}</Text>
            ) : null}
          </View>
        ))}
      {!data.siteRecords.some((r) => r.projectId === selectedProject) ? (
        <Text style={styles.text}>No site records for this project yet.</Text>
      ) : null}
    </Page>
  );
}
