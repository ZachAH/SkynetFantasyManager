import { Cpu } from "lucide-react";
import { Panel } from "../UI/Panel";
import { StatusPill } from "../UI/StatusPill";
import clsx from "clsx";
import { fmtPoints, injuryBadge, isEmptySlot, playerDisplayName } from "../../lib/format";
import { parseRosterPositions, slotLabel } from "../../lib/rosterSlots";
import type { SleeperMatchup, SleeperPlayersMap, SleeperRoster } from "../../types/sleeper";

interface Props {
  roster: SleeperRoster;
  players: SleeperPlayersMap | undefined;
  rosterPositions: string[];
  matchup: SleeperMatchup | undefined;
}

function PlayerRow({
  slot,
  playerId,
  points,
  players,
}: {
  slot?: string;
  playerId: string;
  points: number | undefined;
  players: SleeperPlayersMap | undefined;
}) {
  const empty = isEmptySlot(playerId);
  const player = players?.[playerId];
  const name = playerDisplayName(player, playerId);
  const inj = injuryBadge(player?.injury_status);

  return (
    <div className="flex items-center justify-between border-b border-line/60 py-1.5 last:border-b-0">
      <div className="flex min-w-0 items-center gap-2">
        {slot && (
          <span className="w-14 shrink-0 font-mono text-[10px] font-bold tracking-wider text-red-glow/80">
            {slotLabel(slot)}
          </span>
        )}
        <span className={clsx("truncate text-xs", empty ? "italic text-text-faint" : "text-text-primary")}>
          {name}
        </span>
        {!empty && (
          <span className="shrink-0 font-mono text-[10px] text-text-faint">
            {player?.position ?? ""}
            {player?.team ? ` · ${player.team}` : ""}
          </span>
        )}
        {inj.label && <StatusPill label={inj.label} tone={inj.tone === "none" ? "none" : inj.tone} />}
      </div>
      {!empty && points !== undefined && (
        <span className="shrink-0 font-mono text-xs font-bold text-text-primary tabular-nums">{fmtPoints(points)}</span>
      )}
    </div>
  );
}

export function RosterCard({ roster, players, rosterPositions, matchup }: Props) {
  const shape = parseRosterPositions(rosterPositions);
  const starters = roster.starters ?? [];
  const reserve = roster.reserve ?? [];
  const taxi = roster.taxi ?? [];
  const bench = (roster.players ?? []).filter(
    (id) => !starters.includes(id) && !reserve.includes(id) && !taxi.includes(id),
  );

  const pointsFor = (playerId: string, idx: number) => {
    if (!matchup) return undefined;
    return matchup.starters_points?.[idx] ?? matchup.players_points?.[playerId];
  };

  return (
    <Panel title="Skynet Roster" icon={Cpu} accent="red">
      <div className="mb-3">
        <div className="mb-1 font-mono text-[10px] font-bold tracking-[0.2em] text-text-dim">STARTING LINEUP</div>
        {starters.map((id, idx) => (
          <PlayerRow
            key={`${id}-${idx}`}
            slot={shape.starterSlots[idx]}
            playerId={id}
            points={pointsFor(id, idx)}
            players={players}
          />
        ))}
      </div>

      {bench.length > 0 && (
        <div className="mb-3">
          <div className="mb-1 font-mono text-[10px] font-bold tracking-[0.2em] text-text-dim">BENCH</div>
          {bench.map((id) => (
            <PlayerRow key={id} playerId={id} points={matchup?.players_points?.[id]} players={players} />
          ))}
        </div>
      )}

      {reserve.length > 0 && (
        <div>
          <div className="mb-1 font-mono text-[10px] font-bold tracking-[0.2em] text-crit">INJURED RESERVE</div>
          {reserve.map((id) => (
            <PlayerRow key={id} playerId={id} points={undefined} players={players} />
          ))}
        </div>
      )}
    </Panel>
  );
}
