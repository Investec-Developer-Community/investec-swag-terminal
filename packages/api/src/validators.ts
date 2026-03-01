import { z } from "zod";
import { SHIRT_SIZES, REQUEST_STATUSES, SA_PROVINCES } from "./db/schema";

// ── Shared Enums ───────────────────────────────────────────────

export const ShirtSize = z.enum(SHIRT_SIZES);
export const RequestStatus = z.enum(REQUEST_STATUSES);
export const Province = z.enum(SA_PROVINCES);

// ── Swag Request ───────────────────────────────────────────────

export const CreateSwagRequest = z.object({
  fullName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long"),
  email: z.string().email("Invalid email address"),
  phone: z
    .string()
    .regex(/^\+?[\d\s\-()]{7,15}$/, "Invalid phone number format"),
  shirtSize: ShirtSize,
  note: z
    .string()
    .min(10, "Tell us more! At least 10 characters")
    .max(500, "Note must be under 500 characters"),
  streetAddress: z
    .string()
    .min(3, "Street address is required")
    .max(200, "Address is too long"),
  company: z.string().max(200, "Company name is too long").optional(),
  city: z
    .string()
    .min(2, "City is required")
    .max(100, "City name is too long"),
  province: Province,
  postcode: z
    .string()
    .regex(/^\d{4}$/, "Postcode must be a 4-digit SA postal code"),
  fingerprint: z.string().optional(),
});

export type CreateSwagRequestInput = z.infer<typeof CreateSwagRequest>;

// ── Status Update ──────────────────────────────────────────────

export const UpdateRequestStatus = z
  .object({
    status: z.enum(["approved", "denied", "waitlisted"]),
    reason: z.string().min(1).max(500).optional(),
  })
  .refine(
    (data) => {
      if (data.status === "denied" || data.status === "waitlisted") {
        return !!data.reason;
      }
      return true;
    },
    {
      message: "Reason is required when denying or waitlisting a request",
      path: ["reason"],
    }
  );

export type UpdateRequestStatusInput = z.infer<typeof UpdateRequestStatus>;

// ── Query Params ───────────────────────────────────────────────

export const ListRequestsQuery = z.object({
  status: RequestStatus.optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.enum(["createdAt", "fullName", "status"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export type ListRequestsQueryInput = z.infer<typeof ListRequestsQuery>;

// ── Auth ───────────────────────────────────────────────────────

export const AdminLogin = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export type AdminLoginInput = z.infer<typeof AdminLogin>;
