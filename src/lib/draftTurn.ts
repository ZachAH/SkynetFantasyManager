import type { SleeperDraft, SleeperDraftPick } from "../types/sleeper";

export interface DraftTurnInfo {
  totalPicks: number;
  picksMade: number;
  currentPickNumber: number; // 1-indexed, the next pick to be made
  currentRound: number;
  onTheClockSlot: number; // 1-indexed draft slot
  onTheClockUserId: string | undefined;
  isComplete: boolean;
  skynetSlot: number | undefined;
  isSkynetOnTheClock: boolean;
  picksUntilSkynet: number | undefined; // 0 if Skynet is on the clock now
}

/**
 * Computes whose turn it is from the draft's pick count + draft_order,
 * without needing Sleeper to explicitly expose a "current picker" field.
 * Handles both snake (alternating direction each round) and linear order.
 */
export function computeDraftTurn(
  draft: SleeperDraft | undefined,
  picks: SleeperDraftPick[],
  skynetUserId: string | undefined,
): DraftTurnInfo | undefined {
  if (!draft || !draft.draft_order) return undefined;

  const teams = draft.settings.teams ?? Object.keys(draft.draft_order).length;
  const rounds = draft.settings.rounds ?? 0;
  const totalPicks = teams * rounds;
  const picksMade = picks.length;
  const currentPickNumber = picksMade + 1;
  const isComplete = totalPicks > 0 && picksMade >= totalPicks;

  const currentRound = Math.min(rounds || 1, Math.ceil(currentPickNumber / teams));
  const pickInRound = ((currentPickNumber - 1) % teams) + 1;
  const isSnake = draft.type === "snake";
  const onTheClockSlot = isSnake && currentRound % 2 === 0 ? teams - pickInRound + 1 : pickInRound;

  const slotToUserId = Object.fromEntries(Object.entries(draft.draft_order).map(([uid, slot]) => [slot, uid]));
  const onTheClockUserId = slotToUserId[onTheClockSlot];

  const skynetSlot = skynetUserId ? draft.draft_order[skynetUserId] : undefined;
  const isSkynetOnTheClock = !isComplete && skynetSlot !== undefined && onTheClockSlot === skynetSlot;

  let picksUntilSkynet: number | undefined;
  if (skynetSlot !== undefined && !isComplete) {
    for (let p = currentPickNumber; p <= totalPicks; p++) {
      const r = Math.ceil(p / teams);
      const pir = ((p - 1) % teams) + 1;
      const slot = isSnake && r % 2 === 0 ? teams - pir + 1 : pir;
      if (slot === skynetSlot) {
        picksUntilSkynet = p - currentPickNumber;
        break;
      }
    }
  }

  return {
    totalPicks,
    picksMade,
    currentPickNumber,
    currentRound,
    onTheClockSlot,
    onTheClockUserId,
    isComplete,
    skynetSlot,
    isSkynetOnTheClock,
    picksUntilSkynet,
  };
}
