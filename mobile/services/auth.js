import { api } from "../utils/api";

export const requestPasswordReset = async (email) => (await api.post("/auth/forgot-password", { email })).data;
export const resetPassword = async (token, password) => (await api.post("/auth/reset-password", { token, password })).data;
