# Technical Specification — API & Data Layer

## 1. Overview

The API serves as the shared backend for both the SSH terminal client and the admin web dashboard. It handles swag request CRUD, status management, and admin authentication.

**Runtime:** Bun  
**Framework:** Hono.js  
**Database:** SQLite (local dev) / Turso (production)  
**ORM:** Drizzle ORM  
**Validation:** Zod  

---

## 2. API Endpoints

### 2.1 Swag Requests

#### `POST /api/requests` — Submit a swag request
```
Request Body (JSON):
{
  "fullName": "Sipho Mabena",
  "email": "sipho@example.com",
  "phone": "+27821234567",
  "shirtSize": "L",
  "note": "I built 3 apps on the Investec API this year!",
  "fingerprint": "abc123..."   // optional, from SSH key
}

Response 201:
{
  "id": "uuid-here",
  "status": "pending",
  "createdAt": "2026-03-01T12:00:00Z",
  "message": "Your swag request has been submitted!"
}

Errors:
  422 — Validation error (missing/invalid fields)
  429 — Rate limit exceeded
```

#### `GET /api/requests` — List all requests (admin)
```
Query Params:
  ?status=pending|approved|denied|waitlisted
  ?search=sipho
  ?page=1&limit=20
  ?sort=createdAt&order=desc

Headers:
  Authorization: Bearer <admin-token>

Response 200:
{
  "data": [ ...SwagRequest[] ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 142
  }
}
```

#### `GET /api/requests/:id` — Get single request (admin)
```
Headers:
  Authorization: Bearer <admin-token>

Response 200:
{
  "id": "uuid",
  "fullName": "Sipho Mabena",
  "email": "sipho@example.com",
  "phone": "+27821234567",
  "shirtSize": "L",
  "note": "I built 3 apps on the Investec API this year!",
  "status": "pending",
  "adminReason": null,
  "reviewedBy": null,
  "reviewedAt": null,
  "fingerprint": "abc123",
  "ipAddress": "196.x.x.x",
  "createdAt": "2026-03-01T12:00:00Z",
  "updatedAt": "2026-03-01T12:00:00Z"
}
```

#### `PATCH /api/requests/:id/status` — Update request status (admin)
```
Headers:
  Authorization: Bearer <admin-token>

Request Body:
{
  "status": "approved",       // approved | denied | waitlisted
  "reason": "Great contributor!"  // required for denied/waitlisted
}

Response 200:
{
  "id": "uuid",
  "status": "approved",
  "adminReason": "Great contributor!",
  "reviewedBy": "admin@investec.com",
  "reviewedAt": "2026-03-01T14:00:00Z"
}
```

### 2.2 Stats

#### `GET /api/stats` — Dashboard statistics (admin)
```
Headers:
  Authorization: Bearer <admin-token>

Response 200:
{
  "total": 142,
  "pending": 45,
  "approved": 72,
  "denied": 15,
  "waitlisted": 10,
  "bySize": {
    "XS": 5, "S": 20, "M": 45, "L": 40, "XL": 22, "XXL": 10
  },
  "last7Days": 28,
  "last30Days": 89
}
```

### 2.3 Export

#### `GET /api/requests/export` — CSV export (admin)
```
Headers:
  Authorization: Bearer <admin-token>

Query Params:
  ?status=approved   // optional filter

Response 200 (text/csv):
  Content-Disposition: attachment; filename="swag-requests-2026-03-01.csv"
```

### 2.4 Auth

#### `POST /api/auth/login` — Admin login
```
Request Body:
{
  "email": "admin@investec.com",
  "password": "..."
}

Response 200:
{
  "token": "jwt-token-here",
  "expiresAt": "2026-03-02T12:00:00Z"
}
```

---

## 3. Database Schema (Drizzle ORM)

```typescript
// packages/api/src/db/schema.ts

import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createId } from "@paralleldrive/cuid2";

export const shirtSizes = ["XS", "S", "M", "L", "XL", "XXL"] as const;
export const requestStatuses = ["pending", "approved", "denied", "waitlisted"] as const;

export const swagRequests = sqliteTable("swag_requests", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  shirtSize: text("shirt_size", { enum: shirtSizes }).notNull(),
  note: text("note").notNull(),
  status: text("status", { enum: requestStatuses }).notNull().default("pending"),
  adminReason: text("admin_reason"),
  reviewedBy: text("reviewed_by"),
  reviewedAt: integer("reviewed_at", { mode: "timestamp" }),
  fingerprint: text("fingerprint"),
  ipAddress: text("ip_address"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const adminUsers = sqliteTable("admin_users", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});
```

---

## 4. Validation Schemas (Zod)

```typescript
// packages/api/src/validators.ts

import { z } from "zod";

export const ShirtSize = z.enum(["XS", "S", "M", "L", "XL", "XXL"]);
export const RequestStatus = z.enum(["pending", "approved", "denied", "waitlisted"]);

export const CreateSwagRequest = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^\+?[\d\s-]{7,15}$/, "Invalid phone number"),
  shirtSize: ShirtSize,
  note: z.string().min(10, "Tell us more! At least 10 characters").max(500),
  fingerprint: z.string().optional(),
});

export const UpdateRequestStatus = z.object({
  status: z.enum(["approved", "denied", "waitlisted"]),
  reason: z.string().min(1).max(500).optional(),
}).refine(
  (data) => {
    if (data.status === "denied" || data.status === "waitlisted") {
      return !!data.reason;
    }
    return true;
  },
  { message: "Reason is required when denying or waitlisting a request" }
);

export const ListRequestsQuery = z.object({
  status: RequestStatus.optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.enum(["createdAt", "fullName", "status"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const AdminLogin = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
```

---

## 5. Error Handling

All API errors follow a consistent structure:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email address",
    "details": [
      { "field": "email", "message": "Invalid email address" }
    ]
  }
}
```

Error codes:
| Code               | HTTP Status | Description                     |
|--------------------|-------------|---------------------------------|
| VALIDATION_ERROR   | 422         | Input validation failed          |
| NOT_FOUND          | 404         | Resource not found               |
| UNAUTHORIZED       | 401         | Missing or invalid auth token    |
| RATE_LIMITED       | 429         | Too many requests                |
| INTERNAL_ERROR     | 500         | Unexpected server error          |

---

## 6. Rate Limiting

- **SSH submissions:** Max 3 requests per fingerprint per 24 hours
- **SSH submissions (no fingerprint):** Max 1 request per IP per hour
- **Admin API:** Standard rate limit (100 req/min)

---

## 7. Environment Variables

```env
DATABASE_URL=file:./data/swag.db      # SQLite path (or Turso URL)
DATABASE_AUTH_TOKEN=                    # Turso auth token (production)
JWT_SECRET=                            # Secret for admin JWT tokens
ADMIN_INITIAL_EMAIL=admin@investec.com # Seed admin user
ADMIN_INITIAL_PASSWORD=                # Seed admin password
SSH_HOST_KEY_PATH=./data/host_key      # SSH server host key
SSH_PORT=2222
API_PORT=3000
API_URL=http://localhost:3000          # Used by SSH client
```
