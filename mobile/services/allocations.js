import { api } from "../utils/api";

export const listAllocations = async (params = {}) => (await api.get("/allocations", { params })).data;
export const getAllocation = async (id) => (await api.get(`/allocations/${id}`)).data;
export const confirmPickup = async (id) => (await api.patch(`/allocations/${id}/pickup`)).data;
export const confirmDelivery = async (id) => (await api.patch(`/allocations/${id}/delivered`)).data;
export const rejectAllocation = async (id, reason) => (await api.patch(`/allocations/${id}/reject`, { reason })).data;
export const cancelAllocation = async (id, reason) => (await api.patch(`/allocations/${id}/cancel`, { reason })).data;
export const reassignAllocation = async (id, ngoId, reason) => (await api.patch(`/allocations/${id}/reassign`, { ngoId, reason })).data;
