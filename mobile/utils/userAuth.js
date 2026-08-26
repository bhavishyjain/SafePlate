import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

let ongoingGetUser = null;

export default async function getUserAuth() {
  if (ongoingGetUser) {
    return ongoingGetUser;
  }

  try {
    ongoingGetUser = (async () => {
      let user = null;
      if (Platform.OS === "web") {
        user = localStorage.getItem("user");
      } else {
        user = await AsyncStorage.getItem("user");
      }
      return user ? JSON.parse(user) : null;
    })();

    const result = await ongoingGetUser;
    ongoingGetUser = null;
    return result;
  } catch (error) {
    console.error("getUserAuth error:", error?.message);
    ongoingGetUser = null;
    return null;
  }
}

export async function setUserAuth(user) {
  if (Platform.OS === "web") {
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("auth_token", user.auth_token);
  } else {
    await AsyncStorage.setItem("user", JSON.stringify(user));
    await AsyncStorage.setItem("auth_token", user.auth_token);
  }
}

export async function clearUserAuth() {
  if (Platform.OS === "web") {
    localStorage.removeItem("user");
    localStorage.removeItem("auth_token");
  } else {
    await AsyncStorage.removeItem("user");
    await AsyncStorage.removeItem("auth_token");
  }
}
