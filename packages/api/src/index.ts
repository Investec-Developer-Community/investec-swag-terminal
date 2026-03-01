import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { requestsRouter } from "./routes/requests";
import { statsRouter } from "./routes/stats";
import { authRouter } from "./routes/auth";
import { adminAuth } from "./middleware/auth";

const app = new Hono();

// ── Global Middleware ──────────────────────────────────────────

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: [
      "http://localhost:5173", // Vite dev server
      "http://localhost:3000",
    ],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

// ── Health Check ───────────────────────────────────────────────

app.get("/", (c) =>
  c.json({
    name: "Investec Developer Swag API",
    version: "0.1.0",
    status: "ok",
  })
);

// ── Public Routes ──────────────────────────────────────────────

// Swag request submission (from SSH terminal — no auth needed)
app.route("/api/requests", requestsRouter);

// Auth routes
app.route("/api/auth", authRouter);

// ── Admin Routes (protected) ───────────────────────────────────

const admin = new Hono();
admin.use("*", adminAuth);
admin.route("/requests", requestsRouter);
admin.route("/stats", statsRouter);

app.route("/api/admin", admin);

// ── Error Handler ──────────────────────────────────────────────

app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    },
    500
  );
});

// ── Not Found ──────────────────────────────────────────────────

app.notFound((c) =>
  c.json({ error: { code: "NOT_FOUND", message: "Route not found" } }, 404)
);

// ── Start Server ───────────────────────────────────────────────

const port = parseInt(process.env.API_PORT || "3000");

console.log(`
  ╔═══════════════════════════════════════════╗
  ║  🎁 Investec Swag API                    ║
  ║  Running on http://localhost:${port}        ║
  ╚═══════════════════════════════════════════╝
`);

export default {
  port,
  fetch: app.fetch,
};
