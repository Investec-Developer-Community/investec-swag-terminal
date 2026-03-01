import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import {
  fetchRequests,
  fetchStats,
  updateRequestStatus,
  exportCSV,
  copyRequestToClipboard,
  type SwagRequest,
  type RequestStatus,
  type RequestFilters,
} from "../lib/api";
import Header from "../components/Header";
import StatsCards from "../components/StatsCards";
import StatusBadge from "../components/StatusBadge";
import RequestDetail from "../components/RequestDetail";

export default function DashboardPage() {
  const { logout } = useAuth();
  const queryClient = useQueryClient();

  // Filters
  const [filters, setFilters] = useState<RequestFilters>({
    page: 1,
    limit: 20,
    sort: "createdAt",
    order: "desc",
  });
  const [search, setSearch] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<SwagRequest | null>(null);

  // Queries
  const statsQuery = useQuery({
    queryKey: ["stats"],
    queryFn: fetchStats,
  });

  const requestsQuery = useQuery({
    queryKey: ["requests", filters],
    queryFn: () => fetchRequests({ ...filters, search: search || undefined }),
  });

  // Mutation
  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: "approved" | "denied" | "waitlisted";
      reason?: string;
    }) => updateRequestStatus(id, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      setSelectedRequest(null);
    },
  });

  const handleSearch = () => {
    setFilters((f) => ({ ...f, page: 1 }));
    queryClient.invalidateQueries({ queryKey: ["requests"] });
  };

  const handleStatusFilter = (status: RequestStatus | undefined) => {
    setFilters((f) => ({ ...f, status, page: 1 }));
  };

  return (
    <div className="min-h-screen bg-investec-navy-900">
      <Header onLogout={logout} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        {statsQuery.data && <StatsCards stats={statsQuery.data} />}

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full px-4 py-2 bg-investec-navy-800 border border-investec-navy-700 rounded text-sm text-white placeholder-investec-navy-500 focus:ring-1 focus:ring-investec-teal focus:border-investec-teal outline-none"
            />
          </div>

          {/* Status filter */}
          <select
            value={filters.status || ""}
            onChange={(e) =>
              handleStatusFilter(
                e.target.value ? (e.target.value as RequestStatus) : undefined
              )
            }
            className="px-4 py-2 bg-investec-navy-800 border border-investec-navy-700 rounded text-sm text-white focus:ring-1 focus:ring-investec-teal outline-none"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="denied">Denied</option>
            <option value="waitlisted">Waitlisted</option>
          </select>

          {/* Export */}
          <button
            onClick={() => exportCSV(filters.status)}
            className="px-4 py-2 bg-investec-navy-800 border border-investec-navy-700 text-investec-stone rounded text-sm font-medium hover:border-investec-navy-500 hover:text-white transition-colors"
          >
            Export CSV
          </button>
        </div>

        {/* Table */}
        <div className="bg-investec-navy-800 rounded-lg border border-investec-navy-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-investec-navy-700">
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-investec-navy-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-investec-navy-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-investec-navy-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-investec-navy-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-investec-navy-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-investec-navy-700/50">
              {requestsQuery.data?.data.map((req) => (
                <tr
                  key={req.id}
                  onClick={() => setSelectedRequest(req)}
                  className="hover:bg-investec-navy-700/30 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-3.5 text-sm font-medium text-white">
                    {req.fullName}
                  </td>
                  <td className="px-6 py-3.5 text-sm text-investec-stone">
                    {req.email}
                  </td>
                  <td className="px-6 py-3.5 text-sm text-investec-stone font-mono">
                    {req.shirtSize}
                  </td>
                  <td className="px-6 py-3.5">
                    <StatusBadge status={req.status} />
                  </td>
                  <td className="px-6 py-3.5 text-sm text-investec-navy-500">
                    {new Date(req.createdAt).toLocaleDateString("en-ZA", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </td>
                </tr>
              ))}

              {requestsQuery.data?.data.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-investec-navy-500"
                  >
                    No swag requests found.
                  </td>
                </tr>
              )}

              {requestsQuery.isLoading && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-investec-navy-500"
                  >
                    Loading…
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {requestsQuery.data && requestsQuery.data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-investec-navy-700">
              <p className="text-xs text-investec-navy-500">
                Page {requestsQuery.data.pagination.page} of{" "}
                {requestsQuery.data.pagination.totalPages} ({requestsQuery.data.pagination.total} total)
              </p>
              <div className="flex gap-2">
                <button
                  disabled={filters.page === 1}
                  onClick={() =>
                    setFilters((f) => ({ ...f, page: (f.page || 1) - 1 }))
                  }
                  className="px-3 py-1 text-xs rounded border border-investec-navy-700 text-investec-stone hover:border-investec-navy-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Prev
                </button>
                <button
                  disabled={
                    filters.page === requestsQuery.data.pagination.totalPages
                  }
                  onClick={() =>
                    setFilters((f) => ({ ...f, page: (f.page || 1) + 1 }))
                  }
                  className="px-3 py-1 text-xs rounded border border-investec-navy-700 text-investec-stone hover:border-investec-navy-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Detail Panel */}
      {selectedRequest && (
        <RequestDetail
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onUpdateStatus={(status, reason) =>
            statusMutation.mutate({
              id: selectedRequest.id,
              status,
              reason,
            })
          }
          onCopy={() => copyRequestToClipboard(selectedRequest)}
          isUpdating={statusMutation.isPending}
        />
      )}
    </div>
  );
}
