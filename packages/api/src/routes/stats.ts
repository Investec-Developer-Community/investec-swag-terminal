import { Hono } from "hono";
import { and, count, sql, gte } from "drizzle-orm";
import { db } from "../db";
import {
  REQUEST_STATUSES,
  SHIRT_SIZES,
  type RequestStatus,
  type ShirtSize,
  swagRequests,
} from "../db/schema";

export const statsRouter = new Hono();

const STATS_CACHE_TTL_MS = 30_000;

type StatsPayload = {
  total: number;
  pending: number;
  approved: number;
  denied: number;
  waitlisted: number;
  bySize: Record<ShirtSize, number>;
  last7Days: number;
  last30Days: number;
  approvalRate: number;
  mostRequestedSize: { size: ShirtSize; count: number } | null;
  leaderboard: Array<{
    id: string;
    fullName: string;
    status: RequestStatus;
    note: string;
    createdAt: Date;
  }>;
};

let cachedStats: { value: StatsPayload; expiresAt: number } | null = null;

export function invalidateStatsCache() {
  cachedStats = null;
}

// ── GET /api/admin/stats — Dashboard statistics ────────────────

statsRouter.get("/", async (c) => {
  const now = Date.now();
  if (cachedStats && cachedStats.expiresAt > now) {
    return c.json(cachedStats.value);
  }

  const statusRows = db
    .select({
      status: swagRequests.status,
      total: count(),
    })
    .from(swagRequests)
    .groupBy(swagRequests.status)
    .all();

  const byStatus: Record<RequestStatus, number> = {
    pending: 0,
    approved: 0,
    denied: 0,
    waitlisted: 0,
  };

  for (const row of statusRows) {
    const key = row.status as RequestStatus;
    if (REQUEST_STATUSES.includes(key)) {
      byStatus[key] = row.total;
    }
  }

  const total =
    byStatus.pending +
    byStatus.approved +
    byStatus.denied +
    byStatus.waitlisted;

  const decisions = byStatus.approved + byStatus.denied;
  const approvalRate =
    decisions > 0 ? Number(((byStatus.approved / decisions) * 100).toFixed(1)) : 0;

  const sizeRows = db
    .select({
      size: swagRequests.shirtSize,
      total: count(),
    })
    .from(swagRequests)
    .groupBy(swagRequests.shirtSize)
    .all();

  const bySize = {} as Record<ShirtSize, number>;
  for (const size of SHIRT_SIZES) {
    bySize[size] = 0;
  }
  for (const row of sizeRows) {
    bySize[row.size as ShirtSize] = row.total;
  }

  const mostRequestedSize = (Object.entries(bySize) as [ShirtSize, number][])
    .sort((a, b) => b[1] - a[1])[0];

  const mostRequestedSizeSummary =
    mostRequestedSize && mostRequestedSize[1] > 0
      ? { size: mostRequestedSize[0], count: mostRequestedSize[1] }
      : null;

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const last7Days = db
    .select({ count: count() })
    .from(swagRequests)
    .where(gte(swagRequests.createdAt, sevenDaysAgo))
    .get()?.count || 0;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const last30Days = db
    .select({ count: count() })
    .from(swagRequests)
    .where(gte(swagRequests.createdAt, thirtyDaysAgo))
    .get()?.count || 0;

  const leaderboardRows = db
    .select({
      id: swagRequests.id,
      fullName: swagRequests.fullName,
      note: swagRequests.note,
      status: swagRequests.status,
      createdAt: swagRequests.createdAt,
    })
    .from(swagRequests)
    .where(and(sql`length(${swagRequests.note}) >= 20`, gte(swagRequests.createdAt, thirtyDaysAgo)))
    .orderBy(sql`length(${swagRequests.note}) desc`, sql`${swagRequests.createdAt} desc`)
    .limit(5)
    .all();

  const leaderboard = leaderboardRows.map((row) => ({
    id: row.id,
    fullName: row.fullName,
    status: row.status as RequestStatus,
    createdAt: row.createdAt,
    note: row.note.length > 140 ? `${row.note.slice(0, 140)}…` : row.note,
  }));

  const payload: StatsPayload = {
    total,
    pending: byStatus.pending,
    approved: byStatus.approved,
    denied: byStatus.denied,
    waitlisted: byStatus.waitlisted,
    bySize,
    last7Days,
    last30Days,
    approvalRate,
    mostRequestedSize: mostRequestedSizeSummary,
    leaderboard,
  };

  cachedStats = {
    value: payload,
    expiresAt: now + STATS_CACHE_TTL_MS,
  };

  return c.json(payload);
});
