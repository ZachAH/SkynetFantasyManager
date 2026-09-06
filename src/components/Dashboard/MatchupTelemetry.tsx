import { Radar, Swords } from "lucide-react";
import { Panel } from "../UI/Panel";
import { WinProbabilityMeter } from "./WinProbabilityMeter";
import { fmtPoints, teamNameForUser } from "../../lib/format";
import { estimateWinProbability } from "../../lib/winProbability";
import type { SleeperMatchup, SleeperUser } from "../../types/sleeper";

interface Props {
  week: number | undefined;
  myMatchup: SleeperMatchup | undefined;
  opponentMatchup: SleeperMatchup | undefined;
  opponentUser: SleeperUser | undefined;
  mySeasonAvg: number;
  oppSeasonAvg: number;
}

export function MatchupTelemetry({
  week,
  myMatchup,
  opponentMatchup,
  opponentUser,
  mySeasonAvg,
  oppSeasonAvg,
}: Props) {
  if (!myMatchup) {
    return (
      <Panel title="Matchup Telemetry" icon={Radar} accent="red">
        <p className="font-mono text-xs text-text-dim">No active matchup detected for the current week.</p>
      </Panel>
    );
  }

  const myPoints = myMatchup.points ?? 0;
  const oppPoints = opponentMatchup?.points ?? 0;

  const expectedTotal = mySeasonAvg + oppSeasonAvg;
  const liveTotal = myPoints + oppPoints;
  const gamesCompleted = expectedTotal > 0 ? Math.min(1, liveTotal / expectedTotal) : liveTotal > 0 ? 0.5 : 0;

  const probability = estimateWinProbability({
    myLivePoints: myPoints,
    oppLivePoints: oppPoints,
    mySeasonAvg,
    oppSeasonAvg,
    gamesCompleted,
  });

  return (
    <Panel
      title="Matchup Telemetry"
      icon={Radar}
      accent="red"
      right={<span className="font-mono text-[10px] text-text-faint">WEEK {week ?? "—"}</span>}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="text-center">
          <div className="font-display text-[10px] font-bold tracking-widest text-good">SKYNET</div>
          <div className="font-mono text-2xl font-bold tabular-nums text-text-primary text-glow">
            {fmtPoints(myPoints)}
          </div>
        </div>
        <Swords size={20} className="text-red-glow animate-pulse-slow" />
        <div className="text-center">
          <div className="font-display text-[10px] font-bold tracking-widest text-crit">
            {opponentUser ? teamNameForUser(opponentUser).toUpperCase() : "OPPONENT"}
          </div>
          <div className="font-mono text-2xl font-bold tabular-nums text-text-primary">{fmtPoints(oppPoints)}</div>
        </div>
      </div>

      <WinProbabilityMeter probability={probability} oppLabel={opponentUser ? teamNameForUser(opponentUser).toUpperCase() : "OPPONENT"} />

      <p className="mt-3 font-mono text-[10px] leading-relaxed text-text-faint">
        HEURISTIC ESTIMATE — blends live scoring differential with season-long PPG. Not a Vegas line.
      </p>
    </Panel>
  );
}
