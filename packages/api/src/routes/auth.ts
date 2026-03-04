import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { compare } from "bcryptjs";
import { sign } from "jsonwebtoken";
import { db } from "../db";
import { adminUsers } from "../db/schema";
import { AdminLogin } from "../validators";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return secret;
}

export const authRouter = new Hono();

// ── POST /api/auth/login ───────────────────────────────────────

authRouter.post("/login", async (c) => {
  const body = await c.req.json();
  const parsed = AdminLogin.safeParse(body);

  if (!parsed.success) {
    return c.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid login data",
          details: parsed.error.issues.map((i) => ({
            field: i.path.join("."),
            message: i.message,
          })),
        },
      },
      422
    );
  }

  const { email, password } = parsed.data;

  const user = db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, email))
    .get();

  if (!user) {
    return c.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid credentials" } },
      401
    );
  }

  const valid = await compare(password, user.passwordHash);
  if (!valid) {
    return c.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid credentials" } },
      401
    );
  }

  const token = sign(
    { sub: user.id, email: user.email, name: user.name, role: "admin" },
    getJwtSecret(),
    { expiresIn: "24h" }
  );

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  return c.json({ token, expiresAt });
});
