import { Platform } from "react-native";

const normalizeHost = (value) => value?.trim().replace(/\/+$/, "") || "";
const defaultDevelopmentHost = Platform.OS === "android" ? "http://10.0.2.2:5001" : "http://localhost:5001";
const developmentHost = normalizeHost(process.env.EXPO_PUBLIC_API_URL_DEV) || defaultDevelopmentHost;
const productionHost = normalizeHost(process.env.EXPO_PUBLIC_API_URL_PROD);

if (!__DEV__ && !productionHost) {
  throw new Error("EXPO_PUBLIC_API_URL_PROD is required for production builds");
}

export const API_HOST = __DEV__ ? developmentHost : productionHost;
export const API_BASE_URL = `${API_HOST}/api/v1`;
export const USER_AGENT_STRING = Platform.OS === "ios" ? "SAFEPLATE_IOS" : Platform.OS === "android" ? "SAFEPLATE_ANDROID" : "SAFEPLATE_WEB";

export const LOGIN_URL = `${API_BASE_URL}/auth/login`;
export const REGISTER_URL = `${API_BASE_URL}/auth/register`;
export const ME_URL = `${API_BASE_URL}/auth/me`;
export const DONATIONS_URL = `${API_BASE_URL}/donations`;
export const NGOS_URL = `${API_BASE_URL}/ngos`;
export const OPTIMIZE_URL = `${API_BASE_URL}/optimize`;
export const ALLOCATIONS_URL = `${API_BASE_URL}/allocations`;
export const DASHBOARD_URL = `${API_BASE_URL}/dashboard/summary`;
