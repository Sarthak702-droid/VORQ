import { useState } from "react";
import { View } from "react-native";
import { Documents } from "../components/Documents";
import { Button, EmptyState, Page, ProjectPicker } from "../components/ui";
import { useWorkspace } from "../state/Workspace";
export default function Site() {
  const { workspace, company, project } = useWorkspace();
  const modules = ["site-reports", "labour"].filter((id) =>
    workspace?.modules.some((item) => item.id === id),
  );
  const [selected, setSelected] = useState("");
  const module = modules.includes(selected) ? selected : modules[0];
  return (
    <Page
      title="Site diary"
      subtitle="Daily progress and labour records, shared with your team."
    >
      <ProjectPicker />
      <View style={{ flexDirection: "row", gap: 8 }}>
        {modules.map((id) => (
          <View key={id} style={{ flex: 1 }}>
            <Button
              title={id === "site-reports" ? "Site reports" : "Labour"}
              secondary={id !== module}
              onPress={() => setSelected(id)}
            />
          </View>
        ))}
      </View>
      {module && project ? (
        <Documents key={`${company}:${project}:${module}`} module={module} />
      ) : !modules.length ? (
        <EmptyState
          icon="shield"
          title="Site records restricted"
          description="Your assigned VORQ role controls access to site and labour records."
        />
      ) : null}
    </Page>
  );
}
