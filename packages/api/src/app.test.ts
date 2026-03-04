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
      { sub: "user-1", email: "ada@example.com", name: "Ada Lovelace", role: "viewer" },
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

  test("GET /api/admin/stats returns enhanced aggregate payload", async () => {
    const app = createApp();
    const token = sign(
      { sub: "admin-1", email: "ada@example.com", name: "Ada Lovelace", role: "admin" },
      process.env.JWT_SECRET as string
    );

    const res = await app.request("/api/admin/stats", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(typeof body.total).toBe("number");
    expect(typeof body.approvalRate).toBe("number");
    expect(Array.isArray(body.leaderboard)).toBe(true);
    expect(body.mostRequestedSize === null || typeof body.mostRequestedSize.size === "string").toBe(true);
  });
});
