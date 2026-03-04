import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { publicRequestsRouter, adminRequestsRouter } from "./routes/requests";
import { statsRouter } from "./routes/stats";
import { authRouter } from "./routes/auth";
import { adminAuth } from "./middleware/auth";
import { integrationsRouter } from "./routes/integrations";
import apiPackage from "../package.json";

export function createApp() {
  const app = new Hono();

  app.use("*", logger());
  app.use(
    "*",
    cors({
      origin: ["http://localhost:5173", "http://localhost:3000"],
      allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
    })
  );

  app.get("/", (c) =>
    c.json({
      name: "Investec Developer Swag API",
      version: apiPackage.version,
      status: "ok",
    })
  );

  app.route("/api/requests", publicRequestsRouter);
  app.route("/api/auth", authRouter);
  app.route("/api/integrations", integrationsRouter);

  const admin = new Hono();
  admin.use("*", adminAuth);
  admin.route("/requests", adminRequestsRouter);
  admin.route("/stats", statsRouter);
  app.route("/api/admin", admin);

  app.onError((err, c) => {
    console.error("Unhandled error:", err instanceof Error ? err.message : String(err));
    if (process.env.NODE_ENV !== "production" && err instanceof Error && err.stack) {
      console.error(err.stack);
    }
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

  app.notFound((c) =>
    c.json({ error: { code: "NOT_FOUND", message: "Route not found" } }, 404)
  );

  return app;
}
