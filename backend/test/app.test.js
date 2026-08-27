import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";
import { getConfig } from "../src/config/env.js";

async function withServer(run) {
  const app = createApp(getConfig({ NODE_ENV: "test" }));
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
  }
}

test("health endpoint is available only under the versioned path", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/health`);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).status, "OK");
    assert.ok(response.headers.get("x-request-id"));
    assert.equal((await fetch(`${baseUrl}/health`)).status, 404);
  });
});

test("unversioned API routes are not exposed", async () => {
  await withServer(async (baseUrl) => {
    assert.equal((await fetch(`${baseUrl}/auth/login`)).status, 404);
    assert.equal((await fetch(`${baseUrl}/donations`)).status, 404);
  });
});

test("unknown routes use the structured error contract", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/unknown`);
    const body = await response.json();
    assert.equal(response.status, 404);
    assert.equal(body.error.code, "ROUTE_NOT_FOUND");
    assert.equal(body.error.requestId, response.headers.get("x-request-id"));
  });
});

test("malformed JSON returns a client error", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{bad-json",
    });
    const body = await response.json();
    assert.equal(response.status, 400);
    assert.equal(body.error.code, "INVALID_JSON");
  });
});

test("public registration rejects admin accounts before database access", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Unsafe Admin",
        phone: "9876543210",
        email: "admin@example.org",
        password: "password123",
        role: "ADMIN",
      }),
    });
    const body = await response.json();
    assert.equal(response.status, 400);
    assert.equal(body.error.code, "VALIDATION_ERROR");
    assert.ok(body.error.details.some((detail) => detail.field === "role"));
  });
});

test("protected routes require a Bearer token", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/donations`, {
      headers: { authorization: "Basic not-a-token" },
    });
    const body = await response.json();
    assert.equal(response.status, 401);
    assert.equal(body.error.code, "AUTHENTICATION_REQUIRED");
  });
});
