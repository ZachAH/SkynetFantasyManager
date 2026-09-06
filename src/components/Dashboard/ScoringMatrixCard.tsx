import { ScrollText } from "lucide-react";
import { Panel } from "../UI/Panel";
import { buildScoringMatrix, detectPprFormat } from "../../lib/scoringMatrix";
import { parseRosterPositions, slotLabel } from "../../lib/rosterSlots";
import type { SleeperLeague } from "../../types/sleeper";

interface Props {
  league: SleeperLeague;
}

export function ScoringMatrixCard({ league }: Props) {
  const groups = buildScoringMatrix(league.scoring_settings);
  const shape = parseRosterPositions(league.roster_positions);
  const format = detectPprFormat(league.scoring_settings);

  return (
    <Panel
      title="Rules & Scoring Matrix"
      icon={ScrollText}
      accent="red"
      right={<span className="font-mono text-[10px] font-bold text-red-glow">{format.toUpperCase()}</span>}
    >
      <div className="mb-4 flex flex-wrap gap-1.5">
        {shape.starterSlots.map((slot, idx) => (
          <span
            key={`${slot}-${idx}`}
            className="border border-line-bright bg-panel-raised px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wide text-text-primary"
          >
            {slotLabel(slot)}
          </span>
        ))}
        {shape.benchCount > 0 && (
          <span className="border border-line px-1.5 py-0.5 font-mono text-[10px] text-text-dim">
            BN ×{shape.benchCount}
          </span>
        )}
        {shape.irCount > 0 && (
          <span className="border border-line px-1.5 py-0.5 font-mono text-[10px] text-text-dim">
            IR ×{shape.irCount}
          </span>
        )}
        {shape.taxiCount > 0 && (
          <span className="border border-line px-1.5 py-0.5 font-mono text-[10px] text-text-dim">
            TAXI ×{shape.taxiCount}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {groups.map((group) => (
          <div key={group.name}>
            <div className="mb-1 font-mono text-[10px] font-bold tracking-[0.2em] text-text-dim">
              {group.name.toUpperCase()}
            </div>
            {group.rows.map((row) => (
              <div key={row.key} className="flex items-center justify-between border-b border-line/50 py-1 last:border-b-0">
                <span className="truncate pr-2 text-xs text-text-primary">{row.label}</span>
                <span className="shrink-0 font-mono text-xs font-bold tabular-nums text-red-glow">
                  {row.value > 0 ? "+" : ""}
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </Panel>
  );
}
