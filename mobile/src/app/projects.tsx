import { useState } from "react";
import { Text, View } from "react-native";
import {
  Button,
  Feedback,
  Field,
  message,
  Page,
  styles,
} from "../components/ui";
import { useWorkspace } from "../state/Workspace";
export default function Projects() {
  const { data, change, busy } = useWorkspace();
  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [location, setLocation] = useState("");
  const [feedback, setFeedback] = useState("");
  async function save() {
    try {
      if (!name.trim() || !client.trim())
        throw new Error("Enter the project name and client.");
      if (
        data.projects.some(
          (p) => p.name.toLowerCase() === name.trim().toLowerCase(),
        )
      )
        throw new Error("A project with this name already exists.");
      await change((store) => ({
        ...store,
        projects: [
          ...store.projects,
          {
            id: `project-${Date.now()}`,
            name: name.trim(),
            client: client.trim(),
            location: location.trim(),
          },
        ],
      }));
      setName("");
      setClient("");
      setLocation("");
      setFeedback("Project saved on this device.");
    } catch (error) {
      setFeedback(message(error));
    }
  }
  return (
    <Page
      title="Your projects."
      subtitle="Keep each site's work and billing together."
    >
      <View style={styles.card}>
        <Text style={styles.heading}>Add a project</Text>
        <Field
          label="Project name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Patia residential site"
        />
        <Field label="Client name" value={client} onChangeText={setClient} />
        <Field
          label="Location (optional)"
          value={location}
          onChangeText={setLocation}
        />
        <Button
          title={busy ? "Saving…" : "Save project"}
          disabled={busy}
          onPress={save}
        />
        <Feedback text={feedback} />
      </View>
      {data.projects.map((project) => (
        <View key={project.id} style={styles.card}>
          <Text style={styles.heading}>{project.name}</Text>
          <Text style={styles.text}>
            {project.client}
            {project.location ? ` · ${project.location}` : ""}
          </Text>
          <Text style={styles.badge}>
            {data.bills.filter((b) => b.projectId === project.id).length} BILL
            DRAFTS ·{" "}
            {data.siteRecords.filter((r) => r.projectId === project.id).length}{" "}
            SITE RECORDS
          </Text>
        </View>
      ))}
    </Page>
  );
}
