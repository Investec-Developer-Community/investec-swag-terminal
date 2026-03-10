# Repository Analysis: investec-swag-ssh

## Overview
`investec-swag-ssh` is a community-built, SSH-first swag request portal for the Investec Developer Community. It combines a terminal-native requester experience with a web-based admin workflow.

The repository exists to support an end-to-end flow:
1. A developer submits a swag request through an SSH TUI.
2. The API validates and stores the request.
3. Admin users review and action requests from a dashboard.
4. Optional integrations poll new submissions for downstream automation.

## Architecture
The codebase is a monorepo with three runtime packages under `packages/`:

- `packages/ssh`: Go SSH server and Bubble Tea TUI (port 2222).
- `packages/api`: Hono API on Bun with Drizzle + SQLite/Turso-compatible data layer (port 3000).
- `packages/admin`: React + Vite + Tailwind admin dashboard (port 5173).

Cross-cutting architecture characteristics:
- Clear separation between public and protected API routes.
- JWT-based admin authorization middleware.
- Shared domain concepts (request statuses, shirt sizes, review lifecycle).
- Specification-driven development with dedicated docs in `specs/`.

## Key Components
- **SSH Experience (`packages/ssh`)**: Multi-page Bubble Tea model (`splash -> form -> review -> submitting -> confirm/error -> easter egg`) with 9-step data collection and animated submission states.
- **API Request Routes (`packages/api/src/routes/requests.ts`)**: Handles public submission (`POST /api/requests`), admin request listing/detail, CSV export, and status updates.
- **API Stats Route (`packages/api/src/routes/stats.ts`)**: Produces dashboard aggregates (status totals, approval rate, size distribution, leaderboard) with a 30-second in-memory cache.
- **API Auth + Middleware (`packages/api/src/routes/auth.ts`, `packages/api/src/middleware/auth.ts`)**: Login flow issues JWT; middleware enforces admin role checks.
- **Integrations Route (`packages/api/src/routes/integrations.ts`)**: Token-protected polling endpoint (`GET /api/integrations/submissions`) with cursor-based `since` support and `nextSince` response cursor.
- **Admin Data Layer (`packages/admin/src/lib/api.ts`)**: Typed API client for dashboard queries/mutations, auth header handling, CSV export, and clipboard formatting.
- **Admin Dashboard (`packages/admin/src/pages/DashboardPage.tsx`)**: TanStack Query orchestration of request list, stats cards, status mutation flows, search/filtering, and pagination.

## Technologies Used
- **Languages**: TypeScript, Go, SQL (via Drizzle ORM)
- **Backend**: Bun runtime, Hono web framework, Drizzle ORM, SQLite
- **Frontend**: React 19, React Router, TanStack Query, Tailwind CSS, Vite
- **Terminal UI / SSH**: Bubble Tea, Huh, Lip Gloss, Wish/Charm SSH stack
- **Auth/Security**: JSON Web Tokens, bcrypt password verification
- **Tooling**: Bun workspaces, TypeScript compiler, Go modules, Drizzle kit
- **Testing**: `bun:test` API test suite (`packages/api/src/app.test.ts`)

## Data Flow
1. **Submission entry**: SSH client collects user input (identity, motivation note, shirt size, SA delivery address) and submits JSON to API `POST /api/requests`.
2. **Validation and persistence**: API validates with Zod schemas, enriches metadata (fingerprint/IP), inserts into `swag_requests`, and returns request ID + status.
3. **Admin operations**: Dashboard authenticates via `POST /api/auth/login`, stores token client-side, and requests protected data from `/api/admin/*` endpoints.
4. **Operational insights**: Dashboard requests `/api/admin/stats`; API computes or serves cached aggregates.
5. **Review lifecycle**: Admin actions `PATCH /api/admin/requests/:id/status` write reviewer metadata (`reviewedBy`, `reviewedAt`) and invalidate stats cache.
6. **External automation**: Integrations poll `/api/integrations/submissions` using `x-flow-token` and incremental `since` cursoring.

## Team and Ownership
Observed from the last 12 months of git data:
- **Total commits (all history)**: 12
- **Commits in last year**: 10
- **Contributors in last year**:
  - `programmable-banking-community`: 8 commits
  - `Nick Benson`: 2 commits

Subsystem contribution footprint (last year):
- **API**: 4 (`programmable-banking-community`), 1 (`Nick Benson`)
- **SSH**: 5 (`programmable-banking-community`), 2 (`Nick Benson`)
- **Admin**: 3 (`programmable-banking-community`), 1 (`Nick Benson`)
- **Specs/Docs**: 6 (`programmable-banking-community`), 1 (`Nick Benson`)

This suggests a small, highly collaborative team where one maintainer drives most implementation/documentation changes, with founder/owner participation across all three product surfaces.