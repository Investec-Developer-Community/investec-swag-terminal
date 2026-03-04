import { createApp } from "./app";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const parsedPort = Number(process.env.API_PORT || "3000");
if (Number.isNaN(parsedPort)) {
  throw new Error("API_PORT must be a valid number");
}

requireEnv("JWT_SECRET");

const app = createApp();

// ── Start Server ───────────────────────────────────────────────

const port = parsedPort;

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
