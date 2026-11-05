import Head from "expo-router/head";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import { Platform, View } from "react-native";
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Login } from "../components/Login";
import { LaunchScreen } from "../components/LaunchScreen";
import { WorkspaceProvider, useWorkspace } from "../state/Workspace";
import { colors } from "../components/ui";
import { Icon, type IconName } from "../components/Icon";
function TabIcon({ name, focused }: { name: IconName; focused: boolean }) {
  return (
    <View
      style={{
        width: 52,
        height: 31,
        borderRadius: 18,
        backgroundColor: focused ? colors.pale : "transparent",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon name={name} size={21} color={focused ? colors.green : "#969CAF"} />
    </View>
  );
}
export default function Layout() {
  const [launched, setLaunched] = useState(false);
  const finishLaunch = useCallback(() => setLaunched(true), []);
  return (
    <SafeAreaProvider>
      <Head>
        <title>VORQ</title>
      </Head>
      <WorkspaceProvider>
        <View
          style={{ flex: 1, backgroundColor: launched ? "#E4E7EF" : "#080C16", alignItems: "center" }}
        >
          <SafeAreaView
            edges={["top", "left", "right"]}
            style={{
              flex: 1,
              width: "100%",
              maxWidth: Platform.OS === "web" ? 480 : undefined,
              backgroundColor: launched ? "white" : "#080C16",
            }}
          >
            <AuthenticatedApp launched={launched} onLaunchComplete={finishLaunch} />
          </SafeAreaView>
        </View>
      </WorkspaceProvider>
    </SafeAreaProvider>
  );
}

function AppTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: "#969CAF",
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: "white",
          borderTopColor: colors.border,
          height: 72 + insets.bottom,
          paddingTop: 9,
          paddingBottom: 8 + insets.bottom,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          marginTop: 3,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="billing"
        options={{
          title: "Billing",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="bill" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="site"
        options={{
          title: "Site diary",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="site" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: "Projects",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="projects" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

function AuthenticatedApp({ launched, onLaunchComplete }: { launched: boolean; onLaunchComplete: () => void }) {
  const { session, checking } = useWorkspace();
  return (
    <View style={{ flex: 1, backgroundColor: launched ? "white" : "#080C16" }}>
      <StatusBar style={launched ? "dark" : "light"} />
      <View
        style={{ flex: 1 }}
        pointerEvents={launched ? "auto" : "none"}
        accessibilityElementsHidden={!launched}
        importantForAccessibility={launched ? "auto" : "no-hide-descendants"}
      >
        {!checking ? (session ? <AppTabs /> : <Login />) : null}
      </View>
      {!launched ? <LaunchScreen ready={!checking} onComplete={onLaunchComplete} /> : null}
    </View>
  );
}
