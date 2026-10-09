import axios from "axios";
import { router } from "expo-router";
import { API_BASE_URL, USER_AGENT_STRING } from "../url";
import getUserAuth, { clearUserAuth, setUserAuth } from "./userAuth";
import { runSingleRefresh } from "./refreshQueue";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { "User-Agent": USER_AGENT_STRING },
});

api.interceptors.request.use(async (config) => {
  const session = await getUserAuth();
  if (session?.accessToken) config.headers.Authorization = `Bearer ${session.accessToken}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config;
    const isAuthRoute = request?.url?.includes("/auth/login") || request?.url?.includes("/auth/refresh");
    if (error.response?.status !== 401 || request?._retried || isAuthRoute) throw normalizeApiError(error);

    request._retried = true;
    try {
      const accessToken = await runSingleRefresh(refreshSession);
      request.headers.Authorization = `Bearer ${accessToken}`;
      return api(request);
    } catch (refreshError) {
      await clearUserAuth();
      router.replace("/(app)/(auth)/login");
      throw normalizeApiError(refreshError);
    }
  },
);

async function refreshSession() {
  const current = await getUserAuth();
  if (!current?.refreshToken) throw new Error("No refresh token available");
  const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken: current.refreshToken });
  const next = {
    ...current,
    accessToken: data.accessToken,
    auth_token: data.accessToken,
    refreshToken: data.refreshToken,
    accessTokenExpiresAt: data.accessTokenExpiresAt,
    refreshTokenExpiresAt: data.refreshTokenExpiresAt,
  };
  await setUserAuth(next);
  return next.accessToken;
}

export function normalizeApiError(error) {
  if (error?.isSafePlateError) return error;
  const payload = error?.response?.data?.error ?? error?.response?.data ?? {};
  const normalized = new Error(payload.message || error?.message || "Something went wrong");
  normalized.name = "SafePlateApiError";
  normalized.isSafePlateError = true;
  normalized.status = error?.response?.status;
  normalized.code = payload.code || "REQUEST_FAILED";
  normalized.details = Array.isArray(payload.details) ? payload.details : [];
  normalized.requestId = payload.requestId;
  normalized.original = error;
  return normalized;
}

export default function apiCall({ method, url, data, headers, params }) {
  return api({ method, url, data, headers, params });
}
