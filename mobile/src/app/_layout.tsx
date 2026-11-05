import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { WorkspaceProvider } from "../state/Workspace";
import { colors } from "../components/ui";
export default function Layout() {
  return (
    <SafeAreaProvider>
      <WorkspaceProvider>
        <StatusBar style="dark" />
        <Tabs
          screenOptions={{
            headerTitle: "VORQ",
            headerShadowVisible: false,
            headerStyle: { backgroundColor: colors.paper },
            headerTintColor: colors.ink,
            tabBarActiveTintColor: colors.green,
            tabBarStyle: { backgroundColor: "white" },
            tabBarIconStyle: { display: "none" },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: "700",
              marginBottom: 12,
            },
          }}
        >
          <Tabs.Screen name="index" options={{ title: "Overview" }} />
          <Tabs.Screen name="billing" options={{ title: "Billing" }} />
          <Tabs.Screen name="site" options={{ title: "Site diary" }} />
          <Tabs.Screen name="projects" options={{ title: "Projects" }} />
        </Tabs>
      </WorkspaceProvider>
    </SafeAreaProvider>
  );
}
