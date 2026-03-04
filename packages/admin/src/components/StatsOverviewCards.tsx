import type { StatsResponse } from "../lib/api";

interface StatsOverviewCardsProps {
  stats: StatsResponse;
}

export default function StatsOverviewCards({ stats }: StatsOverviewCardsProps) {
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-investec-navy-800 border border-investec-navy-700 rounded-lg p-4">
          <p className="text-xs font-medium text-investec-stone uppercase tracking-wider mb-1">
            Total Requests
          </p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
          <p className="text-xs text-investec-navy-500 mt-1">all submissions</p>
        </div>

        <div className="bg-investec-navy-800 border border-investec-navy-700 rounded-lg p-4">
          <p className="text-xs font-medium text-investec-stone uppercase tracking-wider mb-1">
            Approval Rate
          </p>
          <p className="text-2xl font-bold text-white">{stats.approvalRate}%</p>
          <p className="text-xs text-investec-navy-500 mt-1">approved vs denied</p>
        </div>

        <div className="bg-investec-navy-800 border border-investec-navy-700 rounded-lg p-4">
          <p className="text-xs font-medium text-investec-stone uppercase tracking-wider mb-1">
            Most Requested Size
          </p>
          <p className="text-2xl font-bold text-white">
            {stats.mostRequestedSize?.size ?? "—"}
          </p>
          <p className="text-xs text-investec-navy-500 mt-1">
            {stats.mostRequestedSize
              ? `${stats.mostRequestedSize.count} requests`
              : "no data yet"}
          </p>
        </div>

        <div className="bg-investec-navy-800 border border-investec-navy-700 rounded-lg p-4">
          <p className="text-xs font-medium text-investec-stone uppercase tracking-wider mb-1">
            Last 7 Days
          </p>
          <p className="text-2xl font-bold text-white">{stats.last7Days}</p>
          <p className="text-xs text-investec-navy-500 mt-1">recent momentum</p>
        </div>
      </div>

      <div className="bg-investec-navy-800 border border-investec-navy-700 rounded-lg p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <p className="text-investec-stone">
            Pending: <span className="text-white font-semibold">{stats.pending}</span>
          </p>
          <p className="text-investec-stone">
            Approved: <span className="text-white font-semibold">{stats.approved}</span>
          </p>
          <p className="text-investec-stone">
            Denied: <span className="text-white font-semibold">{stats.denied}</span>
          </p>
          <p className="text-investec-stone">
            Waitlisted: <span className="text-white font-semibold">{stats.waitlisted}</span>
          </p>
        </div>
      </div>
    </>
  );
}
