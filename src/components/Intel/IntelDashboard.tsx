import { TrendingAddsFeed } from "./TrendingAddsFeed";
import { InjuryWatch } from "./InjuryWatch";
import { MarketIntelSearch } from "./MarketIntelSearch";

export function IntelDashboard() {
  return (
    <div className="space-y-4">
      <InjuryWatch />
      <TrendingAddsFeed />
      <MarketIntelSearch />
    </div>
  );
}
