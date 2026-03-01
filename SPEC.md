# Investec Developer Swag Portal — Product Specification

## 1. Vision

An SSH-based interactive terminal experience for the **Investec Developer Community** to request swag (merchandise). Community members SSH into the portal, complete a fun, guided form, and submit their request. An admin web dashboard allows the Investec team to approve, deny, or waitlist requests — with full visibility into all submissions.

**Tagline:** `ssh swag.investec.dev` → Get your merch.

---

## 2. User Personas

### 2.1 Community Member (Requester)
- Investec API developer, hackathon participant, or community contributor
- Comfortable with a terminal (they're developers!)
- Wants a fast, fun way to request swag without filling out a boring web form

### 2.2 Admin (Reviewer)
- Investec DevRel team member
- Needs to see all requests at a glance, approve/deny/waitlist with reasons
- Needs to copy details for fulfilment (shipping label, CRM entry, etc.)

---

## 3. User Flows

### 3.1 Requester Flow (SSH Terminal)

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  1. ssh swag.investec.dev                                    │
│     ↓                                                        │
│  2. Splash screen with Investec ASCII art & welcome msg      │
│     ↓                                                        │
│  3. "Request Swag" form (guided, field-by-field):            │
│     • Full Name                                              │
│     • Email Address                                          │
│     • Phone Number                                           │
│     • Shirt Size (XS / S / M / L / XL / XXL)                │
│     • Note: "Tell us why you deserve some swag!" (textarea)  │
│     ↓                                                        │
│  4. Review & Confirm screen (shows all entered info)         │
│     ↓                                                        │
│  5. Submission confirmation with a fun message               │
│     "🎉 Your request is in! We'll be in touch."              │
│     ↓                                                        │
│  6. Option to submit another request or exit                 │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 Admin Flow (Web Dashboard)

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  1. Navigate to admin.swag.investec.dev / login              │
│     ↓                                                        │
│  2. Dashboard: table of all swag requests                    │
│     • Filterable by status: Pending / Approved / Denied /    │
│       Waitlisted                                             │
│     • Sortable by date, name, status                         │
│     • Search by name or email                                │
│     ↓                                                        │
│  3. Click a request → Detail panel slides open               │
│     • Full details (name, email, phone, size, note)          │
│     • "Copy All" button → copies formatted text to clipboard │
│     • Action buttons: Approve / Deny / Waitlist              │
│     • Reason field (required for Deny/Waitlist)              │
│     ↓                                                        │
│  4. Status updates saved, optional email notification        │
│     sent to requester                                        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. Feature Requirements

### 4.1 SSH Terminal Interface (MVP)

| ID    | Feature                         | Priority | Description                                                |
|-------|----------------------------------|----------|------------------------------------------------------------|
| T-001 | SSH Server                       | P0       | Accept SSH connections, no auth required (or key-based ID)  |
| T-002 | Splash Screen                    | P0       | Investec-branded ASCII art, welcome message                |
| T-003 | Swag Request Form                | P0       | Guided multi-step form with validation                      |
| T-004 | Shirt Size Selector              | P0       | Interactive picker: XS, S, M, L, XL, XXL                   |
| T-005 | Note/Reason Field                | P0       | Multi-line text input for "why you deserve swag"            |
| T-006 | Review Screen                    | P0       | Display all entered data before submission                  |
| T-007 | Submit & Confirm                 | P0       | POST to API, show success/error message                     |
| T-008 | Input Validation                 | P0       | Email format, required fields, phone format                 |
| T-009 | SSH Fingerprint Capture          | P1       | Track SSH public key fingerprint for deduplication          |
| T-010 | Theming (Investec brand colors)  | P1       | Dark background, Investec blue (#003D6A) accents            |
| T-011 | Fun animations/transitions       | P2       | Typing effects, progress dots, emoji celebration            |

### 4.2 API Backend (MVP)

| ID    | Feature                              | Priority | Description                                                |
|-------|---------------------------------------|----------|------------------------------------------------------------|
| A-001 | POST /api/requests                    | P0       | Submit a new swag request (public, no auth)                 |
| A-002 | GET /api/admin/requests               | P0       | List all requests (admin, JWT protected, with filters)      |
| A-003 | GET /api/admin/requests/:id           | P0       | Get single request details (admin)                          |
| A-004 | PATCH /api/admin/requests/:id/status  | P0       | Update status (approve/deny/waitlist) with reason           |
| A-005 | GET /api/admin/stats                  | P1       | Dashboard stats (total, by status, by size)                 |
| A-006 | POST /api/admin/requests/:id/notify   | P2       | Send email notification to requester                        |
| A-007 | GET /api/admin/requests/export        | P2       | Export requests as CSV                                      |

### 4.3 Admin Web Dashboard (MVP)

| ID    | Feature                         | Priority | Description                                                |
|-------|----------------------------------|----------|------------------------------------------------------------|
| W-001 | Login / Auth                     | P0       | Simple auth (password or OAuth)                             |
| W-002 | Request Table                    | P0       | Paginated table with all swag requests                      |
| W-003 | Status Filters                   | P0       | Filter by Pending / Approved / Denied / Waitlisted          |
| W-004 | Request Detail Panel             | P0       | Slide-out or modal showing full request info                |
| W-005 | Approve / Deny / Waitlist Actions| P0       | Buttons with reason input for deny/waitlist                  |
| W-006 | Copy to Clipboard                | P0       | One-click copy of formatted request details                 |
| W-007 | Search                           | P1       | Search by name or email                                     |
| W-008 | Stats Cards                      | P1       | Visual counters: pending, approved, denied, waitlisted      |
| W-009 | CSV Export                       | P2       | Download all requests as CSV                                |
| W-010 | Email Notification Trigger       | P2       | Send templated email to requester on status change           |

---

## 5. Data Model

### SwagRequest

| Field         | Type      | Required | Description                                    |
|---------------|-----------|----------|------------------------------------------------|
| id            | UUID      | auto     | Primary key                                    |
| fullName      | string    | yes      | Requester's full name                          |
| email         | string    | yes      | Requester's email address                      |
| phone         | string    | yes      | Requester's phone number                       |
| shirtSize     | enum      | yes      | XS, S, M, L, XL, XXL                          |
| note          | text      | yes      | Why they should receive swag                   |
| status        | enum      | auto     | pending, approved, denied, waitlisted          |
| adminReason   | text      | no       | Admin's reason for deny/waitlist               |
| reviewedBy    | string    | no       | Admin who reviewed                             |
| reviewedAt    | timestamp | no       | When it was reviewed                           |
| fingerprint   | string    | no       | SSH key fingerprint (for dedup)                |
| ipAddress     | string    | no       | Requester's IP address                         |
| createdAt     | timestamp | auto     | When request was submitted                     |
| updatedAt     | timestamp | auto     | Last update timestamp                          |

---

## 6. Technical Architecture

```
                  ┌──────────────┐
                  │  Developer   │
                  │  (Terminal)  │
                  └──────┬───────┘
                         │ SSH (port 2222)
                         ▼
              ┌─────────────────────┐
              │   Go SSH Server     │
              │   (Bubble Tea TUI)  │
              │   cmd/ssh/main.go   │
              └──────────┬──────────┘
                         │ HTTP POST
                         ▼
              ┌─────────────────────┐
              │   API Server        │
              │   (Hono.js / Bun)   │
              │   /api/requests     │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │   SQLite / Turso    │
              │   (Database)        │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │   Admin Dashboard   │
              │   (React SPA)       │
              │   /admin/*          │
              └─────────────────────┘
```

---

## 7. Non-Functional Requirements

| Requirement    | Target                                                   |
|----------------|----------------------------------------------------------|
| Availability   | SSH server should be reachable 99.5% uptime              |
| Latency        | Form submission < 500ms response time                    |
| Security       | Admin dashboard behind authentication                    |
| Data Privacy   | Personal data encrypted at rest, POPIA compliant         |
| Scalability    | Support 100+ concurrent SSH sessions                     |
| Branding       | Investec color palette, professional but fun tone         |

---

## 8. Investec Brand Guidelines (Applied)

| Element        | Value                                                    |
|----------------|----------------------------------------------------------|
| Primary Color  | Investec Blue `#003D6A`                                  |
| Accent Color   | Investec Teal `#00A5B5`                                  |
| Highlight      | Gold/Amber `#D4A843` (for CTAs and success states)       |
| Background     | Deep Navy `#001B2E` (terminal) / White (admin web)       |
| Font (TUI)     | Monospace (terminal default)                             |
| Font (Web)     | Inter / System sans-serif                                |
| Tone           | Professional but approachable, developer-friendly        |

---

## 9. Success Metrics

| Metric                              | Target (3 months)    |
|--------------------------------------|----------------------|
| Total swag requests submitted        | 500+                 |
| Average time to complete form (SSH)  | < 2 minutes          |
| Admin review turnaround              | < 48 hours           |
| Developer satisfaction (NPS)         | 8+/10                |

---

## 10. Out of Scope (V1)

- Payment processing
- Inventory management / stock tracking
- Shipping label generation
- OAuth/SSO integration for SSH (V2)
- Multi-language support
- Mobile-responsive admin (nice-to-have)

---

## 11. Open Questions

1. Should we require SSH key auth or allow anonymous submissions?
2. Rate limiting strategy — per fingerprint? Per IP?
3. Email notification provider preference? (SendGrid, Resend, etc.)
4. Should the admin dashboard be publicly accessible with auth, or VPN-only?
5. Do we need to integrate with an existing CRM or fulfilment system?
