import type { RequestStatus } from "../lib/api";

interface StatusBadgeProps {
  status: RequestStatus;
}

const statusStyles: Record<RequestStatus, string> = {
  pending: "bg-investec-teal/15 text-investec-teal border-investec-teal/30",
  approved: "bg-investec-teal/15 text-investec-sky-300 border-investec-teal/30",
  denied: "bg-investec-burgundy/15 text-red-300 border-investec-burgundy/30",
  waitlisted: "bg-investec-navy-700 text-investec-stone border-investec-navy-500/30",
};

const statusLabels: Record<RequestStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  denied: "Denied",
  waitlisted: "Waitlisted",
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium ${statusStyles[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}
