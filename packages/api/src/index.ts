import { createApp } from "./app";

const app = createApp();

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
