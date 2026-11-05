import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { client } from "../api/runtime";
import {
  formatAmount,
  type Overview as ProjectOverview,
} from "../api/contracts";
import { useWorkspace } from "../state/Workspace";
import {
  Button,
  colors,
  EmptyState,
  message,
  Page,
  ProjectPicker,
  Section,
  styles,
} from "../components/ui";
import { Icon, type IconName } from "../components/Icon";
export default function Overview() {
  const { session, company, project, workspace } = useWorkspace();
  return (
    <Page
      title="Overview"
      subtitle={`Welcome, ${session?.full_name?.split(" ")[0] || "back"}.`}
    >
      {!company ? (
        <EmptyState
          icon="shield"
          title="Workspace access pending"
          description="Your account is signed in. A VORQ administrator must assign company and project membership before records become available."
        />
      ) : (
        <>
          <ProjectPicker />
          {project ? (
            <ProjectSummary key={`${company}:${project}:${workspace}`} />
          ) : (
            <Button
              title="Open projects"
              icon="projects"
              onPress={() => router.navigate("/projects")}
            />
          )}
          <Section title="Workspace" />
          <View
            style={{
              backgroundColor: "white",
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 10,
            }}
          >
            {(
              [
                {
                  title: "Billing",
                  subtitle: "Client invoices, supplier & subcontract bills",
                  path: "/billing",
                  icon: "bill",
                  module: [
                    "sales-invoices",
                    "purchase-invoices",
                    "ra-bills",
                    "expenses",
                  ],
                },
                {
                  title: "Site diary",
                  subtitle: "Progress reports and labour attendance",
                  path: "/site",
                  icon: "site",
                  module: ["site-reports", "labour"],
                },
                {
                  title: "Projects",
                  subtitle: `${workspace?.projects.length || 0} assigned projects`,
                  path: "/projects",
                  icon: "projects",
                  module: ["projects"],
                },
              ] as const
            )
              .filter((item) =>
                item.module.some((id) =>
                  workspace?.modules.some((m) => m.id === id),
                ),
              )
              .map((item, index) => (
                <Pressable
                  key={item.title}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${item.title}`}
                  onPress={() => router.navigate(item.path)}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 15,
                    padding: 18,
                    borderTopWidth: index ? 1 : 0,
                    borderTopColor: colors.border,
                    opacity: pressed ? 0.6 : 1,
                  })}
                >
                  <Icon
                    name={item.icon as IconName}
                    size={21}
                    color={colors.green}
                  />
                  <View style={{ flex: 1, gap: 5 }}>
                    <Text
                      style={{
                        color: colors.ink,
                        fontWeight: "600",
                        fontSize: 14,
                      }}
                    >
                      {item.title}
                    </Text>
                    <Text
                      style={{
                        color: colors.muted,
                        fontSize: 11,
                        lineHeight: 17,
                      }}
                    >
                      {item.subtitle}
                    </Text>
                  </View>
                  <Icon name="chevron" size={16} color={colors.muted} />
                </Pressable>
              ))}
          </View>
          <Text style={{ color: colors.muted, fontSize: 11, lineHeight: 18 }}>
            {company} · {workspace?.role}. Records and access are managed by
            your VORQ server.
          </Text>
        </>
      )}
    </Page>
  );
}
function ProjectSummary() {
  const { company, project, workspace } = useWorkspace();
  const [overview, setOverview] = useState<ProjectOverview | null>(null);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    client
      .request<ProjectOverview>("overview", { company, project })
      .then((result) => {
        if (active) {
          setOverview(result);
          setError("");
        }
      })
      .catch((err) => {
        if (active) setError(message(err));
      });
    return () => {
      active = false;
    };
  }, [company, project, revision, workspace]);
  const current = workspace?.projects.find((item) => item.name === project);
  return (
    <View style={{ gap: 16 }}>
      {error ? (
        <View style={styles.card}>
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
          <Button
            secondary
            title="Retry overview"
            onPress={() => setRevision((value) => value + 1)}
          />
        </View>
      ) : null}
      <View style={styles.card}>
        <View style={styles.between}>
          <Text style={styles.eyebrow}>PROJECT STATUS</Text>
          <Text style={[styles.badge, { color: "#36664D" }]}>
            {overview?.status || current?.status}
          </Text>
        </View>
        <Text style={styles.heading}>{current?.project_name}</Text>
        <Text style={styles.text}>{current?.name}</Text>
        {overview ? (
          <>
            <View style={styles.between}>
              <Text style={styles.text}>Reported completion</Text>
              <Text
                style={{ fontSize: 14, fontWeight: "700", color: colors.ink }}
              >
                {overview.progress}%
              </Text>
            </View>
            <View
              style={{ backgroundColor: "#EDF0F4", height: 5, borderRadius: 3 }}
            >
              <View
                style={{
                  width: `${Math.min(100, Math.max(0, overview.progress))}%`,
                  backgroundColor: colors.green,
                  height: 5,
                  borderRadius: 3,
                }}
              />
            </View>
          </>
        ) : !error ? (
          <ActivityIndicator color={colors.green} />
        ) : null}
      </View>
      {overview?.financials ? (
        <View style={styles.card}>
          <Text style={styles.eyebrow}>POSTED LEDGER · SELECTED PROJECT</Text>
          <View style={styles.between}>
            <Text style={styles.text}>Expense</Text>
            <Text style={styles.heading}>
              {formatAmount(overview.financials.expense)}
            </Text>
          </View>
          <View style={styles.between}>
            <Text style={styles.text}>Income balance</Text>
            <Text style={styles.heading}>
              {formatAmount(overview.financials.income_balance)}
            </Text>
          </View>
          <Text style={{ color: colors.muted, fontSize: 10, lineHeight: 17 }}>
            From VORQ General Ledger entries. Income balance uses the ledger’s
            debit-minus-credit sign.
          </Text>
        </View>
      ) : null}
    </View>
  );
}
