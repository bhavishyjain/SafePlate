import { getConfig } from "../config/env.js";

export function paginationFromQuery(query) {
  const maximum = getConfig().maximumPageSize;
  const requestedPage = Number.parseInt(query.page ?? "1", 10);
  const requestedLimit = Number.parseInt(query.limit ?? "20", 10);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const limit = Math.min(maximum, Number.isSafeInteger(requestedLimit) && requestedLimit > 0 ? requestedLimit : 20);
  const allowedSorts = new Set(["createdAt", "-createdAt", "updatedAt", "-updatedAt", "assignedAt", "-assignedAt"]);
  const sort = allowedSorts.has(query.sort) ? query.sort : "-createdAt";
  return { page, limit, skip: (page - 1) * limit, sort };
}

export function paginatedResult(items, total, { page, limit }) {
  return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}
