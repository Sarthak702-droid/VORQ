import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { createClient } from "./client";
export const backendUrl =
  Platform.OS === "web"
    ? ""
    : process.env.EXPO_PUBLIC_API_URL ||
      (__DEV__
        ? Platform.OS === "android"
          ? "http://10.0.2.2:18080"
          : "http://localhost:18080"
        : "");
if (Platform.OS !== "web" && !__DEV__ && !backendUrl.startsWith("https://"))
  throw new Error(
    "Set EXPO_PUBLIC_API_URL to your HTTPS VORQ backend before making a release build.",
  );
const sessionKey = `vorq.sid.${backendUrl.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
let sid = "";
let expired = () => {};
export const client = createClient({
  baseUrl: backendUrl,
  cookie: () => (Platform.OS === "web" ? "" : sid),
  onCookie:
    Platform.OS === "web"
      ? undefined
      : async (value) => {
          await SecureStore.setItemAsync(sessionKey, value);
          sid = value;
        },
  onExpired: () => expired(),
});
export function onSessionExpired(callback: () => void) {
  expired = callback;
  return () => {
    expired = () => {};
  };
}
export async function restoreNativeSession() {
  if (Platform.OS !== "web")
    sid = (await SecureStore.getItemAsync(sessionKey)) || "";
}
export async function clearNativeSession() {
  sid = "";
  client.setCsrf("");
  if (Platform.OS !== "web") await SecureStore.deleteItemAsync(sessionKey);
}
