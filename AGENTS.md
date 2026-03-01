# Investec Developer Swag SSH Portal — Development Guide

## Repository Structure

- `/packages/api/`: Hono.js API backend (Bun runtime, bun:sqlite)
- `/packages/ssh/`: Go SSH server with Bubble Tea TUI
- `/packages/admin/`: React admin dashboard (Vite + Tailwind)
- `/specs/`: Product and technical specifications

## Build & Test Commands

- `cd packages/api && bun --hot src/index.ts`: Run API server (port 3000)
- `cd packages/admin && bun run dev`: Run admin dashboard (port 5173)
- `cd packages/ssh && go run ./cmd/ssh/main.go`: Run SSH server (port 2222)
- `cd packages/api && bunx drizzle-kit push`: Apply database schema
- `cd packages/api && bun src/db/seed.ts`: Seed initial admin user
- `cd packages/api && bunx drizzle-kit studio`: Open Drizzle Studio (DB browser)
- `bun build`: Build API + Admin for production
- `cd packages/ssh && go build -o bin/ssh-server ./cmd/ssh/main.go`: Build Go SSH binary
- `bun test`: Run API tests
- `bun typecheck`: TypeScript type checking

## Code Style Guidelines

- **Imports**: Group by source — stdlib → external → local
- **Types**: Use Zod for runtime validation, TypeScript types for interfaces
- **Naming**: PascalCase for types/components, camelCase for functions/variables
- **Error Handling**: All API errors use standard `{ error: { code, message } }` envelope
- **Go**: Standard Go formatting, Bubble Tea Model-View-Update pattern
- **Testing**: Use `bun:test` for API, `go test` for SSH
- **Database**: Drizzle ORM with `bun:sqlite` driver (not `better-sqlite3`)
- **API Routing**: Public routes at `/api/requests`, admin routes at `/api/admin/*` (JWT protected)
- **Environment**: Copy `.env.example` to `.env` for local config
