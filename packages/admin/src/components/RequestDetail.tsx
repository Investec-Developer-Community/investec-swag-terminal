import { useState } from "react";
import type { SwagRequest } from "../lib/api";
import StatusBadge from "./StatusBadge";

interface RequestDetailProps {
  request: SwagRequest;
  onClose: () => void;
  onUpdateStatus: (
    status: "approved" | "denied" | "waitlisted",
    reason?: string
  ) => void;
  onCopy: () => void;
  isUpdating: boolean;
}

export default function RequestDetail({
  request,
  onClose,
  onUpdateStatus,
  onCopy,
  isUpdating,
}: RequestDetailProps) {
  const [reason, setReason] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAction = (status: "approved" | "denied" | "waitlisted") => {
    if ((status === "denied" || status === "waitlisted") && !reason.trim()) {
      alert("Please provide a reason for denying or waitlisting.");
      return;
    }
    onUpdateStatus(status, reason || undefined);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-investec-navy-900 border-l border-investec-navy-700 shadow-2xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-investec-navy-900 border-b border-investec-navy-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">
            Swag Request{" "}
            <span className="text-investec-teal font-mono text-xs">
              #{request.id.slice(0, 8)}
            </span>
          </h2>
          <button
            onClick={onClose}
            className="text-investec-navy-500 hover:text-white text-lg transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Status */}
          <div className="flex items-center gap-3">
            <StatusBadge status={request.status} />
            {request.reviewedAt && (
              <span className="text-xs text-investec-navy-500">
                Reviewed{" "}
                {new Date(request.reviewedAt).toLocaleDateString("en-ZA")}
              </span>
            )}
          </div>

          {/* Details Grid */}
          <div className="space-y-3">
            <DetailRow label="Full Name" value={request.fullName} />
            <DetailRow label="Email" value={request.email} />
            <DetailRow label="Phone" value={request.phone} />
            <DetailRow label="Shirt Size" value={request.shirtSize} mono />
          </div>

          {/* Delivery Address */}
          <div>
            <p className="text-[11px] font-semibold text-investec-navy-500 uppercase tracking-wider mb-2">
              Delivery Address
            </p>
            <div className="bg-investec-navy-800 border border-investec-navy-700 rounded p-4 text-sm text-investec-stone space-y-1">
              <p className="text-white">{request.streetAddress}</p>
              {request.company && <p className="text-investec-navy-500">{request.company}</p>}
              <p>{request.city}, {request.province}</p>
              <p>{request.postcode}</p>
            </div>
          </div>

          {/* Note */}
          <div>
            <p className="text-[11px] font-semibold text-investec-navy-500 uppercase tracking-wider mb-2">
              Why they should get swag
            </p>
            <div className="bg-investec-navy-800 border border-investec-navy-700 rounded p-4 text-sm text-investec-stone leading-relaxed italic">
              "{request.note}"
            </div>
          </div>

          {/* Meta */}
          <div className="text-xs text-investec-navy-500 space-y-1 font-mono">
            <p>
              submitted{" "}
              {new Date(request.createdAt).toLocaleString("en-ZA")}
            </p>
            {request.fingerprint && (
              <p>fingerprint {request.fingerprint.slice(0, 20)}…</p>
            )}
            {request.ipAddress && <p>ip {request.ipAddress}</p>}
          </div>

          {/* Admin Reason (if exists) */}
          {request.adminReason && (
            <div>
              <p className="text-[11px] font-semibold text-investec-navy-500 uppercase tracking-wider mb-1">
                Admin Reason
              </p>
              <p className="text-sm text-investec-stone">{request.adminReason}</p>
            </div>
          )}

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="w-full py-2.5 border border-dashed border-investec-navy-700 rounded text-sm font-medium text-investec-stone hover:border-investec-teal hover:text-investec-teal transition-colors"
          >
            {copied ? "Copied to clipboard" : "Copy Details"}
          </button>

          {/* Admin Actions */}
          {request.status === "pending" && (
            <div className="border-t border-investec-navy-700 pt-6 space-y-4">
              <h3 className="text-xs font-semibold text-investec-navy-500 uppercase tracking-wider">
                Admin Action
              </h3>

              <div>
                <label className="block text-xs text-investec-navy-500 mb-1">
                  Reason (required for deny/waitlist)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-investec-navy-800 border border-investec-navy-700 rounded text-sm text-white placeholder-investec-navy-500 focus:ring-1 focus:ring-investec-teal focus:border-investec-teal outline-none resize-none"
                  placeholder="e.g. Great community contributor!"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleAction("approved")}
                  disabled={isUpdating}
                  className="flex-1 py-2.5 bg-investec-teal text-white font-semibold rounded text-sm hover:brightness-110 transition disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleAction("denied")}
                  disabled={isUpdating}
                  className="flex-1 py-2.5 bg-investec-burgundy text-white font-semibold rounded text-sm hover:brightness-110 transition disabled:opacity-50"
                >
                  Deny
                </button>
                <button
                  onClick={() => handleAction("waitlisted")}
                  disabled={isUpdating}
                  className="flex-1 py-2.5 bg-investec-navy-700 text-investec-stone font-semibold rounded text-sm hover:bg-investec-navy-500 transition disabled:opacity-50"
                >
                  Waitlist
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="text-[11px] font-semibold text-investec-navy-500 uppercase tracking-wider w-24 shrink-0">
        {label}
      </span>
      <span
        className={`text-sm text-white ${mono ? "font-mono" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
