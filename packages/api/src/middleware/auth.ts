import { Hono } from "hono";
import type { Context, Next } from "hono";
import { verify } from "jsonwebtoken";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return secret;
}

/**
 * Middleware: Verify admin JWT token.
 * Attaches decoded user to context.
 */
export async function adminAuth(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return c.json(
      { error: { code: "UNAUTHORIZED", message: "Missing authorization token" } },
      401
    );
  }

  const token = authHeader.slice(7);

  try {
    const decoded = verify(token, getJwtSecret()) as {
      sub: string;
      email: string;
      name: string;
      role?: string;
    };

    if (decoded.role !== "admin") {
      return c.json(
        { error: { code: "FORBIDDEN", message: "Admin access required" } },
        403
      );
    }

    c.set("admin", decoded);
    await next();
  } catch {
    return c.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid or expired token" } },
      401
    );
  }
}
