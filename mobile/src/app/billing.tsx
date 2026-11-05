import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useWorkspace } from "../state/Workspace";
import { moduleLabels } from "../api/contracts";
import { Documents } from "../components/Documents";
import {
  colors,
  EmptyState,
  Page,
  ProjectPicker,
  styles,
} from "../components/ui";
export default function Billing() {
  const { company, project, workspace } = useWorkspace();
  const { create } = useLocalSearchParams<{ create?: string }>();
  const modules = [
    "sales-invoices",
    "ra-bills",
    "purchase-invoices",
    "expenses",
  ].filter((id) => workspace?.modules.some((item) => item.id === id));
  const [selected, setSelected] = useState("");
  const module = modules.includes(selected) ? selected : modules[0];
  return (
    <Page
      title="Billing"
      subtitle="Invoices and bills from your VORQ accounts."
    >
      <ProjectPicker />
      {modules.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {modules.map((id) => (
            <Pressable
              key={id}
              accessibilityRole="tab"
              accessibilityState={{ selected: id === module }}
              onPress={() => {
                setSelected(id);
                router.setParams({ create: undefined });
              }}
              style={{
                minHeight: 44,
                paddingHorizontal: 15,
                justifyContent: "center",
                borderBottomWidth: 2,
                borderBottomColor: id === module ? colors.green : "transparent",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: id === module ? colors.green : colors.muted,
                  fontWeight: id === module ? "700" : "500",
                }}
              >
                {moduleLabels[id]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <EmptyState
          icon="shield"
          title="Financial access restricted"
          description="Your account’s assigned role controls billing access. Contact your VORQ administrator if you need access."
        />
      )}
      {module && project ? (
        <View>
          <Documents
            key={`${company}:${project}:${module}`}
            module={module}
            startCreating={create === "1"}
            onCreated={() => router.setParams({ create: undefined })}
          />
        </View>
      ) : null}
      <Text style={[styles.text, { fontSize: 11 }]}>
        Taxes, certification and financial posting follow the VORQ server’s
        document workflow.
      </Text>
    </Page>
  );
}
