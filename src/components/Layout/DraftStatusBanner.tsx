import { Radio } from "lucide-react";
import clsx from "clsx";
import { useDraftTurn } from "../../hooks/useDraftTurn";
import { teamNameForUser } from "../../lib/format";

interface Props {
  onGoToConsole: () => void;
}

export function DraftStatusBanner({ onGoToConsole }: Props) {
  const { draft, turn, onTheClockUser, isDraftLive } = useDraftTurn();

  if (!draft || (draft.status !== "drafting" && draft.status !== "paused") || !turn || turn.isComplete) {
    return null;
  }

  const clockLabel = onTheClockUser ? teamNameForUser(onTheClockUser).toUpperCase() : `SLOT ${turn.onTheClockSlot}`;

  return (
    <div
      className={clsx(
        "border-b px-4 py-2 font-mono text-xs sm:px-6",
        turn.isSkynetOnTheClock
          ? "animate-pulse-slow border-red-glow bg-red-deep/40 text-red-glow"
          : "border-line-bright bg-panel-raised text-text-dim",
      )}
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Radio size={13} className={isDraftLive ? "animate-pulse text-red-glow" : ""} />
          <span className="font-bold tracking-wider">
            {draft.status === "paused" ? "DRAFT PAUSED" : "DRAFT LIVE"} — ROUND {turn.currentRound} · PICK{" "}
            {turn.currentPickNumber}/{turn.totalPicks}
          </span>
          <span>
            ON THE CLOCK: <span className="font-bold">{clockLabel}</span>
          </span>
        </div>

        {turn.isSkynetOnTheClock ? (
          <button
            onClick={onGoToConsole}
            className="border border-red-glow bg-red-glow/10 px-2.5 py-1 font-bold tracking-widest text-red-glow hover:bg-red-glow/20"
          >
            SKYNET IS ON THE CLOCK → GET PICK
          </button>
        ) : turn.picksUntilSkynet !== undefined ? (
          <span className="text-text-faint">
            SKYNET PICKS IN {turn.picksUntilSkynet} {turn.picksUntilSkynet === 1 ? "PICK" : "PICKS"}
          </span>
        ) : null}
      </div>
    </div>
  );
}
