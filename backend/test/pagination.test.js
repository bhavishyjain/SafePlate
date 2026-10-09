import test from "node:test";
import assert from "node:assert/strict";
import { paginationFromQuery, paginatedResult } from "../src/utils/pagination.js";

test("pagination applies safe defaults and the maximum page size", () => {
  assert.deepEqual(paginationFromQuery({}), { page: 1, limit: 20, skip: 0, sort: "-createdAt" });
  assert.equal(paginationFromQuery({ page: "2", limit: "500" }).limit, 100);
  assert.equal(paginationFromQuery({ page: "2", limit: "10" }).skip, 10);
  assert.equal(paginationFromQuery({ page: "invalid", limit: "invalid" }).page, 1);
});

test("paginated results include deterministic metadata", () => {
  assert.deepEqual(paginatedResult(["item"], 21, { page: 2, limit: 10 }), {
    items: ["item"],
    pagination: { page: 2, limit: 10, total: 21, pages: 3 },
  });
});
