import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const SESSION_KEY = "safeplate.session.v1";
let cachedSession;

async function readValue() {
  if (Platform.OS === "web") return globalThis.localStorage?.getItem(SESSION_KEY) ?? null;
  return SecureStore.getItemAsync(SESSION_KEY);
}

async function writeValue(value) {
  if (Platform.OS === "web") globalThis.localStorage?.setItem(SESSION_KEY, value);
  else await SecureStore.setItemAsync(SESSION_KEY, value, { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK });
}

export default async function getUserAuth() {
  if (cachedSession !== undefined) return cachedSession;
  try {
    const value = await readValue();
    cachedSession = value ? JSON.parse(value) : null;
    return cachedSession;
  } catch {
    const legacy = await AsyncStorage.getItem("user");
    cachedSession = legacy ? JSON.parse(legacy) : null;
    if (cachedSession) await setUserAuth(cachedSession);
    return cachedSession;
  }
}

export async function setUserAuth(session) {
  const normalized = { ...session, accessToken: session.accessToken || session.auth_token, auth_token: session.accessToken || session.auth_token };
  cachedSession = normalized;
  await writeValue(JSON.stringify(normalized));
  await AsyncStorage.multiRemove(["user", "auth_token"]);
  return normalized;
}

export async function clearUserAuth() {
  cachedSession = null;
  if (Platform.OS === "web") globalThis.localStorage?.removeItem(SESSION_KEY);
  else await SecureStore.deleteItemAsync(SESSION_KEY);
  await AsyncStorage.multiRemove(["user", "auth_token"]);
}
