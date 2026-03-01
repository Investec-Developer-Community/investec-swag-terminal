import { Hono } from "hono";
import { eq, count, sql, gte } from "drizzle-orm";
import { db } from "../db";
import { swagRequests, SHIRT_SIZES } from "../db/schema";

export const statsRouter = new Hono();

// ── GET /api/stats — Dashboard statistics ──────────────────────

statsRouter.get("/", async (c) => {
  const total = db
    .select({ count: count() })
    .from(swagRequests)
    .get()?.count || 0;

  const pending = db
    .select({ count: count() })
    .from(swagRequests)
    .where(eq(swagRequests.status, "pending"))
    .get()?.count || 0;

  const approved = db
    .select({ count: count() })
    .from(swagRequests)
    .where(eq(swagRequests.status, "approved"))
    .get()?.count || 0;

  const denied = db
    .select({ count: count() })
    .from(swagRequests)
    .where(eq(swagRequests.status, "denied"))
    .get()?.count || 0;

  const waitlisted = db
    .select({ count: count() })
    .from(swagRequests)
    .where(eq(swagRequests.status, "waitlisted"))
    .get()?.count || 0;

  // Count by shirt size
  const bySize: Record<string, number> = {};
  for (const size of SHIRT_SIZES) {
    const result = db
      .select({ count: count() })
      .from(swagRequests)
      .where(eq(swagRequests.shirtSize, size))
      .get();
    bySize[size] = result?.count || 0;
  }

  // Last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const last7Days = db
    .select({ count: count() })
    .from(swagRequests)
    .where(gte(swagRequests.createdAt, sevenDaysAgo))
    .get()?.count || 0;

  // Last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const last30Days = db
    .select({ count: count() })
    .from(swagRequests)
    .where(gte(swagRequests.createdAt, thirtyDaysAgo))
    .get()?.count || 0;

  return c.json({
    total,
    pending,
    approved,
    denied,
    waitlisted,
    bySize,
    last7Days,
    last30Days,
  });
});
