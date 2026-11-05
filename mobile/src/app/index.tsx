import { router } from "expo-router";
import { Text, View } from "react-native";
import { Button, colors, Page, styles } from "../components/ui";
import { money, totals } from "../domain/records";
import { useWorkspace } from "../state/Workspace";
export default function Overview() {
  const { data } = useWorkspace();
  const claims = data.bills.filter((b) => b.kind === "Client claim");
  const claimAmount = claims.reduce(
    (sum, bill) => sum + totals(bill.lines, bill.deduction).net,
    0,
  );
  return (
    <Page
      title="From site to bill."
      subtitle="Capture the work. Keep the evidence. Give every rupee a clear starting point."
    >
      <View
        style={[
          styles.card,
          { backgroundColor: colors.ink, borderColor: colors.ink },
        ]}
      >
        <Text style={{ color: "#BDD9C6", fontSize: 12, letterSpacing: 1 }}>
          CLIENT CLAIM DRAFTS
        </Text>
        <Text style={{ color: "white", fontSize: 36, fontWeight: "700" }}>
          {money(claimAmount)}
        </Text>
        <Text style={{ color: "#BDD9C6", lineHeight: 21 }}>
          {claims.length} local drafts · Before tax and certification
        </Text>
        <Button
          title="+ Create billing draft"
          onPress={() => router.navigate("/billing")}
        />
      </View>
      <View style={styles.row}>
        {[
          { value: data.projects.length, label: "Projects" },
          { value: data.siteRecords.length, label: "Site records" },
        ].map((item) => (
          <View key={item.label} style={[styles.card, { flex: 1 }]}>
            <Text style={styles.title}>{item.value}</Text>
            <Text style={styles.text}>{item.label}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.heading}>Today’s field kit</Text>
      <Button
        title="Record site work & labour"
        secondary
        onPress={() => router.navigate("/site")}
      />
      <Button
        title="Manage your projects"
        secondary
        onPress={() => router.navigate("/projects")}
      />
      <View style={styles.card}>
        <Text style={styles.heading}>Know what these numbers mean</Text>
        <Text style={styles.text}>
          These are your device’s draft records. Certified work, collections,
          overdue balances and posted costs will be available after connecting
          the VORQ backend.
        </Text>
      </View>
      <Text style={styles.heading}>Recent billing drafts</Text>
      {data.bills.length === 0 ? (
        <Text style={styles.text}>
          Your first bill starts with a project and a measured work item.
        </Text>
      ) : (
        data.bills.slice(0, 3).map((bill) => (
          <View key={bill.id} style={styles.card}>
            <Text style={styles.badge}>{bill.kind.toUpperCase()} · DRAFT</Text>
            <Text style={styles.heading}>{bill.party}</Text>
            <Text style={styles.text}>
              {data.projects.find((p) => p.id === bill.projectId)?.name} ·{" "}
              {bill.date}
            </Text>
            <Text style={styles.heading}>
              {money(totals(bill.lines, bill.deduction).net)}
            </Text>
          </View>
        ))
      )}
    </Page>
  );
}
