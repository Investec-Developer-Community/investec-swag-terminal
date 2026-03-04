export type SubmissionExportPayload = {
  submittedAt: string;
  requestId: string;
  status: string;
  name: string;
  email: string;
  company: string;
  githubUsername: string;
  shirtSize: string;
  country: string;
  shippingAddress: string;
  reason: string;
  sourceIp: string;
};

type SubmissionSource = {
  id: string;
  status: string;
  fullName: string;
  email: string;
  company: string | null;
  shirtSize: string;
  note: string;
  ipAddress: string | null;
  streetAddress: string;
  city: string;
  province: string;
  postcode: string;
  createdAt: Date;
};

export function formatShippingAddress(source: {
  streetAddress: string;
  company: string | null;
  city: string;
  province: string;
  postcode: string;
}) {
  return [
    source.streetAddress,
    source.company,
    source.city,
    source.province,
    source.postcode,
  ]
    .filter(Boolean)
    .join(", ");
}

export function toSubmissionExportPayload(
  source: SubmissionSource,
  sourceIpOverride?: string
): SubmissionExportPayload {
  return {
    submittedAt: source.createdAt.toISOString(),
    requestId: source.id,
    status: source.status,
    name: source.fullName,
    email: source.email,
    company: source.company || "",
    githubUsername: "",
    shirtSize: source.shirtSize,
    country: "South Africa",
    shippingAddress: formatShippingAddress(source),
    reason: source.note,
    sourceIp: sourceIpOverride || source.ipAddress || "unknown",
  };
}