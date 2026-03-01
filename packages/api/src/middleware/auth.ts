import { Hono } from "hono";
import type { Context, Next } from "hono";
import { verify } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

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
    const decoded = verify(token, JWT_SECRET) as {
      sub: string;
      email: string;
      name: string;
    };
    c.set("admin", decoded);
    await next();
  } catch {
    return c.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid or expired token" } },
      401
    );
  }
}
