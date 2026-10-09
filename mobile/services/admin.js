import { api } from "../utils/api";

export const getDashboard = async (params = {}) => (await api.get("/dashboard/summary", { params })).data;
export const runOptimization = async () => (await api.post("/optimize")).data;
export const listUsers = async (params = {}) => (await api.get("/admin/users", { params })).data;
export const getUser = async (id) => (await api.get(`/admin/users/${id}`)).data;
export const setUserStatus = async (id, isActive) => (await api.patch(`/admin/users/${id}/status`, { isActive })).data;
export const revokeUserSessions = async (id) => (await api.post(`/admin/users/${id}/revoke-sessions`)).data;
export const listCatalog = async (params = {}) => (await api.get("/nutrition/catalog", { params })).data;
export const createCatalogItem = async (payload) => (await api.post("/nutrition/catalog", payload)).data;
export const updateCatalogItem = async (id, payload) => (await api.patch(`/nutrition/catalog/${id}`, payload)).data;
