import { TrendingUp, TrendingDown } from "lucide-react";
import { Panel } from "../UI/Panel";
import { LoadingState } from "../UI/LoadingState";
import { StatusPill } from "../UI/StatusPill";
import { useAllPlayers, useTrendingAdds, useTrendingDrops } from "../../hooks/useSleeperLeague";
import { injuryBadge, playerDisplayName } from "../../lib/format";

export function TrendingAddsFeed() {
  const addsQuery = useTrendingAdds(15);
  const dropsQuery = useTrendingDrops(10);
  const playersQuery = useAllPlayers();

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Panel title="Trending Adds (24h)" icon={TrendingUp} accent="green">
        {addsQuery.isLoading || playersQuery.isLoading ? (
          <LoadingState label="SCANNING WAIVER ACTIVITY..." />
        ) : (
          <div>
            {(addsQuery.data ?? []).map((t, idx) => {
              const p = playersQuery.data?.[t.player_id];
              const inj = injuryBadge(p?.injury_status);
              return (
                <div key={t.player_id} className="flex items-center justify-between border-b border-line/50 py-1.5 last:border-b-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="w-5 shrink-0 font-mono text-[10px] text-text-faint">{idx + 1}</span>
                    <span className="truncate text-xs text-text-primary">{playerDisplayName(p, t.player_id)}</span>
                    <span className="shrink-0 font-mono text-[10px] text-text-faint">
                      {p?.position ?? "?"} · {p?.team ?? "FA"}
                    </span>
                    {inj.label && <StatusPill label={inj.label} tone={inj.tone} />}
                  </div>
                  <span className="shrink-0 font-mono text-xs font-bold text-good tabular-nums">+{t.count}</span>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <Panel title="Trending Drops (24h)" icon={TrendingDown} accent="amber">
        {dropsQuery.isLoading || playersQuery.isLoading ? (
          <LoadingState label="SCANNING WAIVER ACTIVITY..." />
        ) : (
          <div>
            {(dropsQuery.data ?? []).map((t, idx) => {
              const p = playersQuery.data?.[t.player_id];
              const inj = injuryBadge(p?.injury_status);
              return (
                <div key={t.player_id} className="flex items-center justify-between border-b border-line/50 py-1.5 last:border-b-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="w-5 shrink-0 font-mono text-[10px] text-text-faint">{idx + 1}</span>
                    <span className="truncate text-xs text-text-primary">{playerDisplayName(p, t.player_id)}</span>
                    <span className="shrink-0 font-mono text-[10px] text-text-faint">
                      {p?.position ?? "?"} · {p?.team ?? "FA"}
                    </span>
                    {inj.label && <StatusPill label={inj.label} tone={inj.tone} />}
                  </div>
                  <span className="shrink-0 font-mono text-xs font-bold text-warn tabular-nums">−{t.count}</span>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}
