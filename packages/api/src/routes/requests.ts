import { Hono } from "hono";
import { eq, desc, asc, like, or, sql, count } from "drizzle-orm";
import { verify } from "jsonwebtoken";
import { db } from "../db";
import { swagRequests, SHIRT_SIZES } from "../db/schema";
import {
  CreateSwagRequest,
  UpdateRequestStatus,
  ListRequestsQuery,
} from "../validators";

export const publicRequestsRouter = new Hono();
export const adminRequestsRouter = new Hono();

// ── POST /api/requests — Submit a new swag request ─────────────

publicRequestsRouter.post("/", async (c) => {
  const body = await c.req.json();
  const parsed = CreateSwagRequest.safeParse(body);

  if (!parsed.success) {
    return c.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request data",
          details: parsed.error.issues.map((i) => ({
            field: i.path.join("."),
            message: i.message,
          })),
        },
      },
      422
    );
  }

  const data = parsed.data;

  const result = db
    .insert(swagRequests)
    .values({
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      shirtSize: data.shirtSize,
      note: data.note,
      streetAddress: data.streetAddress,
      company: data.company || null,
      city: data.city,
      province: data.province,
      postcode: data.postcode,
      fingerprint: data.fingerprint || null,
      ipAddress: c.req.header("x-forwarded-for") || "unknown",
    })
    .returning()
    .get();

  return c.json(
    {
      id: result.id,
      status: result.status,
      createdAt: result.createdAt,
      message: "Your swag request has been submitted! 🎉",
    },
    201
  );
});

// ── GET /api/requests — List requests (admin) ──────────────────

adminRequestsRouter.get("/", async (c) => {
  const query = ListRequestsQuery.safeParse(c.req.query());

  if (!query.success) {
    return c.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid query params" } },
      422
    );
  }

  const { status, search, page, limit, sort, order } = query.data;
  const offset = (page - 1) * limit;

  // Build conditions
  const conditions = [];
  if (status) {
    conditions.push(eq(swagRequests.status, status));
  }
  if (search) {
    conditions.push(
      or(
        like(swagRequests.fullName, `%${search}%`),
        like(swagRequests.email, `%${search}%`)
      )
    );
  }

  const where = conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined;

  // Sort direction
  const sortCol =
    sort === "fullName"
      ? swagRequests.fullName
      : sort === "status"
      ? swagRequests.status
      : swagRequests.createdAt;
  const orderFn = order === "asc" ? asc : desc;

  // Query
  const data = db
    .select()
    .from(swagRequests)
    .where(where)
    .orderBy(orderFn(sortCol))
    .limit(limit)
    .offset(offset)
    .all();

  const totalResult = db
    .select({ count: count() })
    .from(swagRequests)
    .where(where)
    .get();

  const total = totalResult?.count || 0;

  return c.json({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// ── GET /api/requests/export — CSV export (admin) ──────────────

adminRequestsRouter.get("/export", async (c) => {
  const statusFilter = c.req.query("status");
  const where = statusFilter
    ? eq(swagRequests.status, statusFilter as any)
    : undefined;

  const data = db.select().from(swagRequests).where(where).all();

  const headers = [
    "ID",
    "Full Name",
    "Email",
    "Phone",
    "Shirt Size",
    "Note",
    "Status",
    "Admin Reason",
    "Reviewed By",
    "Reviewed At",
    "Created At",
  ];

  const rows = data.map((r) =>
    [
      r.id,
      r.fullName,
      r.email,
      r.phone,
      r.shirtSize,
      `"${(r.note || "").replace(/"/g, '""')}"`,
      r.status,
      r.adminReason || "",
      r.reviewedBy || "",
      r.reviewedAt?.toISOString() || "",
      r.createdAt?.toISOString() || "",
    ].join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");
  const date = new Date().toISOString().split("T")[0];

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="swag-requests-${date}.csv"`,
    },
  });
});

// ── GET /api/requests/:id — Get single request (admin) ─────────

adminRequestsRouter.get("/:id", async (c) => {
  const { id } = c.req.param();

  const request = db
    .select()
    .from(swagRequests)
    .where(eq(swagRequests.id, id))
    .get();

  if (!request) {
    return c.json(
      { error: { code: "NOT_FOUND", message: "Request not found" } },
      404
    );
  }

  return c.json(request);
});

// ── PATCH /api/requests/:id/status — Update status (admin) ─────

adminRequestsRouter.patch("/:id/status", async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json();
  const parsed = UpdateRequestStatus.safeParse(body);

  if (!parsed.success) {
    return c.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid status update",
          details: parsed.error.issues.map((i) => ({
            field: i.path.join("."),
            message: i.message,
          })),
        },
      },
      422
    );
  }

  const existing = db
    .select()
    .from(swagRequests)
    .where(eq(swagRequests.id, id))
    .get();

  if (!existing) {
    return c.json(
      { error: { code: "NOT_FOUND", message: "Request not found" } },
      404
    );
  }

  const updated = db
    .update(swagRequests)
    .set({
      status: parsed.data.status,
      adminReason: parsed.data.reason || null,
      reviewedBy: getReviewerFromToken(c.req.header("Authorization")),
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(swagRequests.id, id))
    .returning()
    .get();

  return c.json(updated);
});

function getReviewerFromToken(authHeader?: string) {
  if (!authHeader?.startsWith("Bearer ")) {
    return "admin";
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return "admin";
  }

  try {
    const decoded = verify(authHeader.slice(7), secret) as {
      email?: string;
      name?: string;
      sub?: string;
    };
    return decoded.email || decoded.name || decoded.sub || "admin";
  } catch {
    return "admin";
  }
}
