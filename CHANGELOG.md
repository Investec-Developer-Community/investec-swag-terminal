# Changelog

## [0.1.6] — 2026-03-02

### Added

- **Form progress bar**: Segmented `━━━` / `───` tracker showing step X/9, auto-detected from huh form output
- **Animated submission sequence**: 4-stage progress with animated braille spinner (80ms cycle) — "Encrypting payload" → "Connecting to Investec" → "Transmitting request" → "Awaiting confirmation"
- **Submission progress bar**: Fills to ~85% during stages, then 100% in teal (success) or burgundy (error)
- **Success/error transition**: 1.2s delay after API response to flash result state (✓/✗) before advancing to confirm/error screen
- **New file `progress.go`**: Houses all progress bar, spinner, and transition logic

### Changed

- **`submittingView()`**: Rewritten from static spinner to fully animated multi-stage view
- **Submit entry points** (review.go `reviewSubmit`, root.go `errorUpdate` retry): Now fire `tea.Batch` with API call + spinner tick + progress step
- **`confirmAnother`**: Now properly calls `m.form.Init()` when resetting to form page
- **Updated all documentation** to reflect delivery address fields, 95/5 brand palette, progress system, and current file structure

## [0.1.5] — 2026-03-01

### Added

- Konami code easter egg on confirmation screen (↑↑↓↓←→←→BA)
- Animated ASCII Rick Astley with karaoke lyrics scroll
- Subtle hint text on confirm screen for discoverability

## [0.1.4] — 2026-03-01

### Changed

- **Admin dashboard dark mode redesign**: Full visual overhaul to match Investec 95/5 brand colour discipline
  - **Tailwind config**: Replaced old `investec-blue/navy/gold/light-grey` tokens with full Navy 900–300, Stone, Sky 300, Teal, Burgundy palette
  - **globals.css**: Dark canvas (`bg-investec-navy-900`), custom scrollbar styling
  - **Header**: Navy 800 surface, Stone subtitle, compact 56px height, mono "admin" label
  - **LoginPage**: Full dark mode — navy-800 card on navy-900 background, teal CTA, navy-700 borders, left-aligned header
  - **DashboardPage**: Dark table with navy-800 rows, navy-700 dividers, navy-500 column headers, teal focus rings, muted pagination
  - **StatsCards**: Navy-800 cards with coloured left borders (teal/burgundy/navy-300), no emoji icons
  - **StatusBadge**: Translucent brand-coloured borders and backgrounds — teal for pending/approved, burgundy for denied, navy for waitlisted
  - **RequestDetail**: Navy-900 slide-out panel, navy-800 content blocks, teal approve button, burgundy deny button, navy-700 waitlist button, mono metadata

## [0.1.3] — 2026-03-01

### Changed

- **SSH TUI splash screen redesign**: Rebuilt home screen to follow Investec 95/5 brand colour discipline
  - ASCII title rendered in single dominant colour (Navy 300) — removed multi-colour teal/gold stacking
  - Left-aligned body content with developer-first infrastructure language
  - Added system status block (node, status, auth/fingerprint)
  - Teal accent used exclusively for interaction cues (`ENTER` key highlight)
  - Removed decorative double-outline boxes from confirm and error screens
- **Theme overhaul** (`theme/investec.go`): Full palette update
  - Core (95%): Navy 900 background, White primary text, Stone secondary, Sky 300 meta, Navy 500 muted
  - Accent (5%): Teal for interaction/success, Burgundy for errors
  - Removed gold (`#D4A843`) and non-brand red (`#E85D5D`)
  - Added `TextSky()`, `TextMuted()` style helpers
- **Consistent screen styling**: Form, review, confirm, and error screens updated — emoji removed from headers, `>` cursor replaces `☉`, muted dividers throughout
- **Version constant**: Added `Version` const in `splash.go`

## [0.1.2] — 2026-03-01

### Added

- **Delivery address fields**: Full South African delivery address support across all three packages
  - **DB schema**: Added `streetAddress`, `company` (nullable), `city`, `province` (SA provinces enum), and `postcode` columns to `swagRequests` table
  - **API validators**: Zod validation for all address fields — postcode regex `/^\d{4}$/`, province enum (9 SA provinces)
  - **API route**: POST `/api/requests` now accepts and stores delivery address fields
  - **SSH TUI form**: Expanded from 5 to 9 steps — street address, company (optional), city + province (grouped), postcode
  - **SSH TUI review**: Added "Delivery Address" section to the pre-submit review screen
  - **Admin dashboard**: Delivery address section in request detail panel, included in clipboard copy
  - **Go API client**: `SwagRequest` struct updated with address fields

## [0.1.1] — 2026-03-01

### Fixed

- **Database driver**: Switched from `better-sqlite3` to `bun:sqlite` in `packages/api/src/db/index.ts` — `better-sqlite3` native bindings are not supported in the Bun runtime
- **API routing**: Fixed broken `POST /api/requests` handler that was failing with 404 — replaced manual `requestsRouter.fetch()` forwarding with direct route mounting
- **Admin API paths**: Moved admin-protected routes from `/api/*` to `/api/admin/*` (requests, stats) to avoid conflicts with the public submission endpoint
- **Admin dashboard API client**: Updated all fetch calls in `packages/admin/src/lib/api.ts` to use `/api/admin/` prefix
- **Root package.json scripts**: Replaced all `bun --cwd` flags with `cd <dir> &&` — `bun --cwd` is not supported in Bun 1.3.x
- **API package.json**: Moved `better-sqlite3` and `@types/better-sqlite3` from `dependencies` to `devDependencies` (only needed by `drizzle-kit` CLI, not at runtime)
- **SPEC.md**: Updated API endpoint paths in section 4.2 to reflect the `/api/admin/` route split

### Added

- `.env` file (copied from `.env.example`) for local development
- `packages/api/data/` directory and `swag.db` SQLite database
- `packages/ssh/data/` directory with generated SSH host key
- Initial admin user seed (`admin@investec.com`)

### Updated

- **AGENTS.md**: Rewritten to match concise agent-friendly format with accurate build commands and code style notes
- **README.md**: Expanded setup instructions with macOS install steps (Bun, Go without Homebrew), direct dev server commands, API routing table, SSH host key troubleshooting tip, and `bun:sqlite` tech stack note
- **go.sum**: Updated after `go mod tidy` resolved dependency versions for the SSH server

## [0.1.0] — Initial Implementation

- Hono.js API backend with Bun runtime
- Go SSH server with Bubble Tea TUI (splash, form, review, confirm screens)
- React admin dashboard with Vite + Tailwind
- SQLite database with Drizzle ORM schema
- JWT-based admin authentication
- Swag request submission, listing, filtering, status management
- Investec brand theming (SSH terminal and web dashboard)
