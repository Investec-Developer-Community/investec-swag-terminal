# Contributing

Thanks for helping improve the Investec Developer Swag SSH Portal.

## Scope

This repository contains three primary apps:

- `packages/api`: Hono API (Bun + SQLite + Drizzle)
- `packages/ssh`: Go SSH server and Bubble Tea TUI
- `packages/admin`: React + Vite admin dashboard

Please keep changes focused and avoid unrelated refactors in the same PR.

## Development Setup

1. Install prerequisites:
- Bun (latest stable)
- Go (matching `packages/ssh/go.mod`)

2. Configure environment:
- Copy `.env.example` to `.env` in repo root

3. Start local services:
- API: `cd packages/api && bun --hot src/index.ts`
- SSH: `cd packages/ssh && SSH_HOST_KEY_PATH=./data/host_key go run ./cmd/ssh/main.go`
- Admin: `cd packages/admin && bun run dev`

## Database Workflow (API)

Use Drizzle for schema updates:

- Apply schema: `cd packages/api && bunx drizzle-kit push`
- Seed admin user: `cd packages/api && bun src/db/seed.ts`

Do not commit local database artifacts unless explicitly required.

## Code Style

- Keep imports grouped as: stdlib, external, local
- Prefer clear, explicit naming over abbreviations
- Use Zod for runtime request validation on API boundaries
- Keep API error responses in the standard envelope: `{ error: { code, message } }`
- Keep SSH TUI behavior consistent with the existing Model-View-Update structure

## Testing and Verification

Run relevant checks before opening a PR:

- Root type checks: `bun typecheck`
- API tests: `bun test`
- SSH build sanity: `cd packages/ssh && go build -o bin/ssh-server ./cmd/ssh/main.go`
- Admin build sanity: `cd packages/admin && bun run build`

If your change touches only one package, run at least that package's checks plus any impacted integration checks.

## Pull Request Guidelines

Include the following in your PR description:

- What changed
- Why it changed
- How it was tested (commands + outcomes)
- Any docs/spec updates performed

For behavioral changes, update relevant docs in:

- `README.md`
- `SPEC.md`
- `specs/*.md`
- `CHANGELOG.md`

## Commit Guidance

- Use small, focused commits
- Write clear commit messages in imperative style
- Avoid mixing formatting-only churn with functional changes

## Security and Privacy

- Never commit secrets, tokens, or private keys
- Never include personal data from real submissions in test fixtures, logs, or screenshots
- Use neutral placeholder values in examples

## Questions

If something is unclear, open an issue or draft PR with context and proposed direction before implementing a broad change.
