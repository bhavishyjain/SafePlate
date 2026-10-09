import { api } from "../utils/api";

export const getMyNgo = async () => (await api.get("/ngos/me")).data;
export const saveMyNgo = async (payload) => (await api.post("/ngos", payload)).data;
export const getNutritionStatus = async (id) => (await api.get(`/ngos/${id}/nutrition-status`)).data;
export const listNgos = async (params = {}) => (await api.get("/ngos", { params })).data;
export const getNgo = async (id) => (await api.get(`/ngos/${id}`)).data;
export const getEligibleNgos = async (donationId) => (await api.get(`/ngos/eligible/${donationId}`)).data;
export const setNutritionOverride = async (id, payload) => (await api.patch(`/ngos/${id}/nutrition-override`, payload)).data;
export const clearNutritionOverride = async (id) => (await api.delete(`/ngos/${id}/nutrition-override`)).data;
