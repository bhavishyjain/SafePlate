import { USER_AGENT_STRING } from "@/url";
import axios from "axios";
import { router } from "expo-router";
import Toast from "react-native-toast-message";
import getUserAuth from "./userAuth";

let cachedUser = null;
let userCachePromise = null;
let lastCacheTime = 0;
const CACHE_TTL = 5000; // 5 seconds cache

let isLoggingOut = false;
const inFlightRequests = new Map();

/* ===========================
   USER CACHE
=========================== */

const getCachedUser = async () => {
  if (cachedUser && Date.now() - lastCacheTime < CACHE_TTL) {
    return cachedUser;
  }

  if (userCachePromise) {
    return userCachePromise;
  }

  userCachePromise = Promise.race([
    getUserAuth(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("getUserAuth timeout")), 5000),
    ),
  ])
    .then((user) => {
      cachedUser = user;
      lastCacheTime = Date.now();
      userCachePromise = null;
      return user;
    })
    .catch((error) => {
      console.error("getUserAuth failed:", error?.message);
      userCachePromise = null;
      return cachedUser;
    });

  return userCachePromise;
};

/* ===========================
   AUTH HELPERS
=========================== */

const getAuthHeaders = async (headers = {}) => {
  try {
    const user = await getCachedUser();
    if (user?.auth_token) {
      return {
        ...headers,
        Authorization: `Bearer ${user.auth_token}`,
        "User-Agent": USER_AGENT_STRING,
      };
    }
    return {
      ...headers,
      "User-Agent": USER_AGENT_STRING,
    };
  } catch {
    return {
      ...headers,
      "User-Agent": USER_AGENT_STRING,
    };
  }
};

const getAuthPayload = async (data = null) => {
  try {
    const user = await getCachedUser();
    if (user?.auth_token) {
      return { ...data, token: user.auth_token };
    }
    return data;
  } catch {
    return data;
  }
};

/* ===========================
   FLATTEN (unchanged)
=========================== */

export const flatten = (obj, prefix = "") => {
  const result = {};
  for (const [key, value] of Object.entries(obj || {})) {
    const prefixed = prefix ? `${prefix}[${key}]` : key;

    if (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value) &&
      !(value?.uri && value?.type)
    ) {
      Object.assign(result, flatten(value, prefixed));
    } else if (Array.isArray(value)) {
      value.forEach((val, i) => {
        Object.assign(result, flatten(val, `${prefixed}[${i}]`));
      });
    } else {
      result[prefixed] = value;
    }
  }
  return result;
};

/* ===========================
   API CALL
=========================== */

const apiCall = async ({
  method,
  url,
  data = null,
  headers = {},
  auth = null,
  dedupeKey = null,
}) => {
  if (dedupeKey && inFlightRequests.has(dedupeKey)) {
    return inFlightRequests.get(dedupeKey);
  }

  const requestPromise = (async () => {
    try {
      const authHeaders = auth
        ? {
          ...headers,
          Authorization: `Bearer ${auth.token}`,
          "User-Agent": USER_AGENT_STRING,
        }
        : await getAuthHeaders(headers);

      const isMultipart = authHeaders?.["Content-Type"]?.includes(
        "multipart/form-data",
      );

      let payload;

      if (isMultipart) {
        const formData = new FormData();
        const authPayload = await getAuthPayload(data);
        const flatData = flatten(authPayload);

        Object.entries(flatData).forEach(([key, value]) => {
          if (value && typeof value === "object" && value.uri) {
            formData.append(key, {
              uri: value.uri,
              name: value.name || "file",
              type: value.type || "application/octet-stream",
            });
          } else {
            formData.append(key, String(value ?? ""));
          }
        });

        payload = formData;
      } else {
        payload = auth
          ? { ...data, token: auth.token }
          : await getAuthPayload(data);
      }

      const axiosConfig = {
        method,
        url,
        data: payload,
        headers: authHeaders,
        timeout: 30000,
      };

      if (!url.includes("pickedup-order")) {
        axiosConfig.transformResponse = [
          (data) => {
            try {
              return typeof data === "string" ? JSON.parse(data) : data;
            } catch {
              return data;
            }
          },
        ];
      }

      const response = await axios(axiosConfig);

      if (response.status >= 400) {
        const error = new Error(
          response.data?.message || `API Error: ${response.status}`,
        );
        error.response = response;
        throw error;
      }

      return response;
    } catch (error) {
      const status = error?.response?.status;
      const data = error?.response?.data ?? {};

      const code = data.code || data.error || null;
      const AUTH_CODES = ["TOKEN_EXPIRED", "TOKEN_INVALID", "AUTH_FAILED"];
      const isAuthError = status === 401 && AUTH_CODES.includes(code);

      if (isAuthError && !isLoggingOut) {
        isLoggingOut = true;
        console.log("Came ehre");

        router.replace("/(app)/(auth)/logout");

        setTimeout(() => {
          Toast.show({
            type: "error",
            text1: error?.response?.data?.message || "Session expired",
          });
        }, 500);
      } else {
        console.error("API Call Error:", error?.message);
        throw error;
      }
    }
  })();

  if (dedupeKey) {
    inFlightRequests.set(dedupeKey, requestPromise);
    requestPromise.finally(() => {
      if (inFlightRequests.get(dedupeKey) === requestPromise) {
        inFlightRequests.delete(dedupeKey);
      }
    });
  }

  return requestPromise;
};

export default apiCall;
