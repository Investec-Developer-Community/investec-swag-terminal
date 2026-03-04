import { Hono } from "hono";
import { asc, gt } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { swagRequests } from "../db/schema";
import { toSubmissionExportPayload } from "../submission-export";

export const integrationsRouter = new Hono();

const PollSubmissionsQuery = z.object({
  since: z.string().optional(),
  limit: z.coerce.number().int().positive().max(500).default(100),
});

integrationsRouter.get("/submissions", (c) => {
  const flowToken = process.env.POWER_AUTOMATE_FLOW_TOKEN;
  if (!flowToken) {
    return c.json(
      {
        error: {
          code: "CONFIG_ERROR",
          message: "POWER_AUTOMATE_FLOW_TOKEN is not configured",
        },
      },
      503
    );
  }

  const providedToken = c.req.header("x-flow-token");
  if (!providedToken || providedToken !== flowToken) {
    return c.json(
      {
        error: {
          code: "UNAUTHORIZED",
          message: "Missing or invalid integration token",
        },
      },
      401
    );
  }

  const parsedQuery = PollSubmissionsQuery.safeParse(c.req.query());
  if (!parsedQuery.success) {
    return c.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid polling query params",
          details: parsedQuery.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
      },
      422
    );
  }

  const { since, limit } = parsedQuery.data;

  let sinceDate: Date | null = null;
  if (since) {
    const parsedSince = new Date(since);
    if (Number.isNaN(parsedSince.getTime())) {
      return c.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid since value; expected ISO-8601 datetime",
          },
        },
        422
      );
    }
    sinceDate = parsedSince;
  }

  const rows = db
    .select()
    .from(swagRequests)
    .where(sinceDate ? gt(swagRequests.createdAt, sinceDate) : undefined)
    .orderBy(asc(swagRequests.createdAt))
    .limit(limit)
    .all();

  const data = rows.map((row) => toSubmissionExportPayload(row));

  const nextSince = data.length > 0 ? data[data.length - 1].submittedAt : since || null;

  return c.json({
    data,
    nextSince,
    count: data.length,
  });
});
