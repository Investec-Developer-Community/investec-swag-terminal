import type { StatsResponse } from "../lib/api";

interface StatsLeaderboardProps {
  leaderboard: StatsResponse["leaderboard"];
}

export default function StatsLeaderboard({ leaderboard }: StatsLeaderboardProps) {
  if (leaderboard.length === 0) {
    return null;
  }

  return (
    <div className="bg-investec-navy-800 border border-investec-navy-700 rounded-lg p-4">
      <p className="text-xs font-medium text-investec-stone uppercase tracking-wider mb-3">
        Top Why-I-Deserve-Swag Reasons
      </p>
      <ul className="space-y-2">
        {leaderboard.slice(0, 3).map((item) => (
          <li key={item.id} className="text-sm text-investec-stone">
            <span className="text-white font-semibold">{item.fullName}:</span>{" "}
            {item.note}
          </li>
        ))}
      </ul>
    </div>
  );
}
