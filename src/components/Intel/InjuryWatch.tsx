import { HeartPulse } from "lucide-react";
import { Panel } from "../UI/Panel";
import { LoadingState } from "../UI/LoadingState";
import { StatusPill } from "../UI/StatusPill";
import { useAllPlayers, useSkynetGM } from "../../hooks/useSleeperLeague";
import { injuryBadge, playerDisplayName } from "../../lib/format";

export function InjuryWatch() {
  const skynet = useSkynetGM();
  const playersQuery = useAllPlayers();

  const rosteredIds = skynet.roster?.players ?? [];
  const flagged = rosteredIds
    .map((id) => ({ id, player: playersQuery.data?.[id] }))
    .filter(({ player }) => player?.injury_status);

  return (
    <Panel title="Skynet Injury Watch" icon={HeartPulse} accent="amber">
      {playersQuery.isLoading ? (
        <LoadingState label="PULLING MEDICAL TELEMETRY..." />
      ) : flagged.length === 0 ? (
        <p className="font-mono text-xs text-text-dim">All Skynet assets report combat-ready. No injury designations.</p>
      ) : (
        <div>
          {flagged.map(({ id, player }) => {
            const inj = injuryBadge(player?.injury_status);
            return (
              <div key={id} className="flex items-center justify-between border-b border-line/50 py-1.5 last:border-b-0">
                <span className="truncate text-xs text-text-primary">{playerDisplayName(player, id)}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-text-faint">
                    {player?.position} · {player?.team}
                    {player?.injury_body_part ? ` · ${player.injury_body_part}` : ""}
                  </span>
                  <StatusPill label={inj.label} tone={inj.tone} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
