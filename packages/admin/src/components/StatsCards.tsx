import type { StatsResponse } from "../lib/api";

interface StatsCardsProps {
  stats: StatsResponse;
}

const cards = [
  { key: "pending", label: "Pending", accent: "border-investec-teal" },
  { key: "approved", label: "Approved", accent: "border-investec-teal" },
  { key: "denied", label: "Denied", accent: "border-investec-burgundy" },
  { key: "waitlisted", label: "Waitlisted", accent: "border-investec-navy-300" },
] as const;

export default function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {cards.map((card) => (
        <div
          key={card.key}
          className={`bg-investec-navy-800 border-l-2 ${card.accent} border border-investec-navy-700 rounded-lg p-4`}
        >
          <p className="text-xs font-medium text-investec-stone uppercase tracking-wider mb-1">
            {card.label}
          </p>
          <p className="text-2xl font-bold text-white">
            {stats[card.key]}
          </p>
          <p className="text-xs text-investec-navy-500 mt-1">
            of {stats.total} total
          </p>
        </div>
      ))}
    </div>
  );
}
