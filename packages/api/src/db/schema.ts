import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createId } from "@paralleldrive/cuid2";

// ── Enums ──────────────────────────────────────────────────────

export const SHIRT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;
export type ShirtSize = (typeof SHIRT_SIZES)[number];

export const SA_PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
] as const;
export type Province = (typeof SA_PROVINCES)[number];

export const REQUEST_STATUSES = [
  "pending",
  "approved",
  "denied",
  "waitlisted",
] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

// ── Tables ─────────────────────────────────────────────────────

export const swagRequests = sqliteTable("swag_requests", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  shirtSize: text("shirt_size", { enum: SHIRT_SIZES }).notNull(),
  note: text("note").notNull(),

  // Delivery address
  streetAddress: text("street_address").notNull(),
  company: text("company"),
  city: text("city").notNull(),
  province: text("province", { enum: SA_PROVINCES }).notNull(),
  postcode: text("postcode").notNull(),

  status: text("status", { enum: REQUEST_STATUSES })
    .notNull()
    .default("pending"),
  adminReason: text("admin_reason"),
  reviewedBy: text("reviewed_by"),
  reviewedAt: integer("reviewed_at", { mode: "timestamp" }),
  fingerprint: text("fingerprint"),
  ipAddress: text("ip_address"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const adminUsers = sqliteTable("admin_users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
