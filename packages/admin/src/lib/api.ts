// ── Types ───────────────────────────────────────────────────────
import { clearStoredToken, getStoredToken } from "./auth";

export type RequestStatus = "pending" | "approved" | "denied" | "waitlisted";
export type ShirtSize = "XS" | "S" | "M" | "L" | "XL" | "XXL";

export interface SwagRequest {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  shirtSize: ShirtSize;
  note: string;
  streetAddress: string;
  company: string | null;
  city: string;
  province: string;
  postcode: string;
  status: RequestStatus;
  adminReason: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  fingerprint: string | null;
  ipAddress: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RequestsResponse {
  data: SwagRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface StatsResponse {
  total: number;
  pending: number;
  approved: number;
  denied: number;
  waitlisted: number;
  bySize: Record<ShirtSize, number>;
  last7Days: number;
  last30Days: number;
}

export interface RequestFilters {
  status?: RequestStatus;
  search?: string;
  page?: number;
  limit?: number;
  sort?: "createdAt" | "fullName" | "status";
  order?: "asc" | "desc";
}

// ── Helpers ─────────────────────────────────────────────────────

function getToken(): string {
  const token = getStoredToken();
  if (!token) throw new Error("Not authenticated");
  return token;
}

function authHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      clearStoredToken();
    }
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error?.message || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ── API Functions ───────────────────────────────────────────────

export async function fetchRequests(filters: RequestFilters = {}): Promise<RequestsResponse> {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.search) params.set("search", filters.search);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.order) params.set("order", filters.order);

  const res = await fetch(`/api/admin/requests?${params}`, {
    headers: authHeaders(),
  });
  return handleResponse<RequestsResponse>(res);
}

export async function fetchRequest(id: string): Promise<SwagRequest> {
  const res = await fetch(`/api/admin/requests/${id}`, {
    headers: authHeaders(),
  });
  return handleResponse<SwagRequest>(res);
}

export async function fetchStats(): Promise<StatsResponse> {
  const res = await fetch("/api/admin/stats", {
    headers: authHeaders(),
  });
  return handleResponse<StatsResponse>(res);
}

export async function updateRequestStatus(
  id: string,
  status: "approved" | "denied" | "waitlisted",
  reason?: string
): Promise<SwagRequest> {
  const res = await fetch(`/api/admin/requests/${id}/status`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ status, reason }),
  });
  return handleResponse<SwagRequest>(res);
}

export async function exportCSV(status?: RequestStatus): Promise<void> {
  const params = status ? `?status=${status}` : "";
  const res = await fetch(`/api/admin/requests/export${params}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });

  if (!res.ok) throw new Error("Export failed");

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `swag-requests-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Clipboard Helper ────────────────────────────────────────────

export function copyRequestToClipboard(request: SwagRequest): void {
  const address = [
    request.streetAddress,
    request.company,
    request.city,
    request.province,
    request.postcode,
  ].filter(Boolean).join(", ");

  const text = `=== Swag Request #${request.id.slice(0, 8)} ===
Name:    ${request.fullName}
Email:   ${request.email}
Phone:   ${request.phone}
Size:    ${request.shirtSize}
Note:    ${request.note}
Address: ${address}
Status:  ${request.status}
Submitted: ${new Date(request.createdAt).toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })}`;

  navigator.clipboard.writeText(text);
}
