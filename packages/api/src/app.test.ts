import { beforeEach, describe, expect, test } from "bun:test";
import { sql } from "drizzle-orm";
import { sign } from "jsonwebtoken";
import { createApp } from "./app";
import { db } from "./db";

describe("API app routing and auth", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "test-jwt-secret";
    process.env.POWER_AUTOMATE_FLOW_TOKEN = "test-flow-token";

    db.run(sql`
      CREATE TABLE IF NOT EXISTS swag_requests (
        id TEXT PRIMARY KEY,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        shirt_size TEXT NOT NULL,
        note TEXT NOT NULL,
        street_address TEXT NOT NULL,
        company TEXT,
        city TEXT NOT NULL,
        province TEXT NOT NULL,
        postcode TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        admin_reason TEXT,
        reviewed_by TEXT,
        reviewed_at INTEGER,
        fingerprint TEXT,
        ip_address TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    db.run(sql`DELETE FROM swag_requests`);
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

  test("GET /api/integrations/submissions requires flow token", async () => {
    const app = createApp();
    const res = await app.request("/api/integrations/submissions");

    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  test("GET /api/integrations/submissions rejects invalid since", async () => {
    const app = createApp();
    const res = await app.request("/api/integrations/submissions?since=not-a-date", {
      headers: {
        "x-flow-token": process.env.POWER_AUTOMATE_FLOW_TOKEN as string,
      },
    });

    expect(res.status).toBe(422);

    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  test("POST /api/requests creates a new swag request", async () => {
    const app = createApp();

    const res = await app.request("/api/requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fullName: "Ada Lovelace",
        email: "ada@example.com",
        phone: "+27821234567",
        shirtSize: "L",
        note: "I built multiple projects on the Investec APIs.",
        streetAddress: "123 Bob's St E",
        city: "Sandton",
        province: "Gauteng",
        postcode: "2191",
      }),
    });

    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.status).toBe("pending");
    expect(typeof body.id).toBe("string");
  });

  test("PATCH /api/admin/requests/:id/status sets reviewedBy from admin claims", async () => {
    const app = createApp();

    const createdAt = Date.now();
    const requestId = "req-test-1";

    db.run(sql`
      INSERT INTO swag_requests (
        id,
        full_name,
        email,
        phone,
        shirt_size,
        note,
        street_address,
        company,
        city,
        province,
        postcode,
        status,
        created_at,
        updated_at
      ) VALUES (
        ${requestId},
        ${"Ada Lovelace"},
        ${"ada@example.com"},
        ${"+27821234567"},
        ${"L"},
        ${"I built multiple projects on the Investec APIs."},
        ${"123 Bob's St E"},
        ${null},
        ${"Sandton"},
        ${"Gauteng"},
        ${"2191"},
        ${"pending"},
        ${createdAt},
        ${createdAt}
      )
    `);

    const token = sign(
      { sub: "admin-1", email: "reviewer@example.com", name: "Reviewer", role: "admin" },
      process.env.JWT_SECRET as string
    );

    const res = await app.request(`/api/admin/requests/${requestId}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "approved" }),
    });

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe("approved");
    expect(body.reviewedBy).toBe("reviewer@example.com");
  });
});
