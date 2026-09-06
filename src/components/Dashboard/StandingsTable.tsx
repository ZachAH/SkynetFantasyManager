import { ListOrdered } from "lucide-react";
import clsx from "clsx";
import { Panel } from "../UI/Panel";
import { fmtPoints, fptsFromRoster, record, teamNameForUser } from "../../lib/format";
import type { SleeperRoster, SleeperUser } from "../../types/sleeper";

interface Props {
  rosters: SleeperRoster[];
  users: SleeperUser[];
  skynetRosterId: number | undefined;
}

export function StandingsTable({ rosters, users, skynetRosterId }: Props) {
  const sorted = [...rosters].sort((a, b) => {
    if (b.settings.wins !== a.settings.wins) return b.settings.wins - a.settings.wins;
    return fptsFromRoster(b) - fptsFromRoster(a);
  });

  return (
    <Panel title="League Standings" icon={ListOrdered} accent="red">
      <table className="w-full border-collapse font-mono text-xs">
        <thead>
          <tr className="border-b border-line-bright text-[10px] tracking-widest text-text-dim">
            <th className="w-8 py-1 text-left font-normal">#</th>
            <th className="py-1 text-left font-normal">TEAM</th>
            <th className="py-1 text-right font-normal">REC</th>
            <th className="py-1 text-right font-normal">PF</th>
            <th className="py-1 text-right font-normal">PA</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, idx) => {
            const user = users.find((u) => u.user_id === r.owner_id);
            const isSkynet = r.roster_id === skynetRosterId;
            return (
              <tr
                key={r.roster_id}
                className={clsx(
                  "border-b border-line/50 last:border-b-0",
                  isSkynet && "bg-red-deep/25 text-red-glow",
                )}
              >
                <td className="py-1.5 text-text-faint">{idx + 1}</td>
                <td className="py-1.5 truncate">
                  {user ? teamNameForUser(user) : "Unknown"}
                  {isSkynet && <span className="ml-1.5 text-[9px] font-bold tracking-wider">[SKYNET]</span>}
                </td>
                <td className="py-1.5 text-right tabular-nums">{record(r)}</td>
                <td className="py-1.5 text-right tabular-nums">{fmtPoints(fptsFromRoster(r))}</td>
                <td className="py-1.5 text-right tabular-nums text-text-dim">
                  {fmtPoints(r.settings.fpts_against + r.settings.fpts_against_decimal / 100)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Panel>
  );
}
