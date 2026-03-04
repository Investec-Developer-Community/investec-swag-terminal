import type { StatsResponse } from "../lib/api";
import StatsLeaderboard from "./StatsLeaderboard";
import StatsOverviewCards from "./StatsOverviewCards";

interface StatsCardsProps {
  stats: StatsResponse;
}

export default function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="space-y-4 mb-8">
      <StatsOverviewCards stats={stats} />
      <StatsLeaderboard leaderboard={stats.leaderboard} />
    </div>
  );
}
