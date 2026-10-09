import { api } from "../utils/api";

export const listDonations = async (params = {}) => (await api.get("/donations", { params })).data;
export const getDonation = async (id) => (await api.get(`/donations/${id}`)).data;
export const createDonation = async (payload) => (await api.post("/donations", payload)).data;
export const updateDonation = async (id, payload) => (await api.patch(`/donations/${id}`, payload)).data;
export const discardDonation = async (id, reason) => (await api.patch(`/donations/${id}/status`, { status: "DISCARDED", reason })).data;
export const analyzeNutrition = async (items) => (await api.post("/nutrition/analyze", { items })).data.items;
