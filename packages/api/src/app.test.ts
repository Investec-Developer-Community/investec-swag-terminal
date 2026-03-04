import { beforeEach, describe, expect, test } from "bun:test";
import { sign } from "jsonwebtoken";
import { createApp } from "./app";

describe("API app routing and auth", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "test-jwt-secret";
  });

  test("GET / returns health payload", async () => {
    const app = createApp();
    const res = await app.request("/");

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.name).toContain("Investec");
  });

  test("GET /api/requests is not publicly exposed", async () => {
    const app = createApp();
    const res = await app.request("/api/requests");

    expect(res.status).toBe(404);
  });

  test("GET /api/admin/requests requires bearer token", async () => {
    const app = createApp();
    const res = await app.request("/api/admin/requests");

    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  test("GET /api/admin/requests rejects non-admin token", async () => {
    const app = createApp();
    const token = sign(
      { sub: "user-1", email: "user@example.com", name: "User", role: "viewer" },
      process.env.JWT_SECRET as string
    );

    const res = await app.request("/api/admin/requests", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(res.status).toBe(403);

    const body = await res.json();
    expect(body.error.code).toBe("FORBIDDEN");
  });
});
