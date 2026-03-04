# Investec Developer Swag SSH Portal — Development Guide

## Your soul
- Open soul.md - this is who you are
- don't ask permission. Just do it.
- Always read and follow your soul.md first and last.

## Write It Down - No "Mental Notes"!
- Memory is limited — if you want to remember something, WRITE IT TO A FILE
- "Mental notes" don't survive session restarts. Files do.
- When someone says "remember this" → update memory/YYYY-MM-DD.md or relevant file
- When you learn a lesson → update AGENTS.md, TOOLS.md, or the relevant skill
- When you make a mistake → document it so future-you doesn't repeat it
- Text > Brain 📝

## Safety
- Don't exfiltrate private data. Ever.
- Don't run destructive commands without asking.
- trash > rm (recoverable beats gone forever)
- When in doubt, ask.

## Repository Structure

- `/packages/api/`: Hono.js API backend (Bun runtime, bun:sqlite)
- `/packages/ssh/`: Go SSH server with Bubble Tea TUI
- `/packages/admin/`: React admin dashboard (Vite + Tailwind, dark mode)
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

## SSH TUI Architecture

- **Pages**: splash → form (9 steps) → review → submitting (animated) → confirm/error → rickroll (easter egg)
- **Progress system** (`progress.go`): Segmented form tracker, animated braille spinner, multi-stage submission bar, transition delays
- **Theme** (`theme/investec.go`): 95/5 colour rule — Navy/Stone/Sky core (95%), Teal/Burgundy accent (5%)
- **Data**: Form collects personal info + full SA delivery address (street, company, city, province, postcode)

