import { Platform } from "react-native";

// In physical device testing, localhost might need to be replaced with your computer's local IP address
export const API_BASE_URL = "http://10.0.2.2:5000"; 

export const USER_AGENT_STRING =
  Platform.OS === "ios"
    ? "SAFEPLATE_IOS"
    : Platform.OS === "android"
      ? "SAFEPLATE_ANDROID"
      : "SAFEPLATE_WEB";

export const LOGIN_URL = `${API_BASE_URL}/auth/login`;
export const REGISTER_URL = `${API_BASE_URL}/auth/register`;
export const ME_URL = `${API_BASE_URL}/auth/me`;

export const DONATIONS_URL = `${API_BASE_URL}/donations`;
export const NGOS_URL = `${API_BASE_URL}/ngos`;
export const OPTIMIZE_URL = `${API_BASE_URL}/optimize`;
export const ALLOCATIONS_URL = `${API_BASE_URL}/allocations`;
export const DASHBOARD_URL = `${API_BASE_URL}/dashboard/summary`;
