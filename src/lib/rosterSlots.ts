const SLOT_LABELS: Record<string, string> = {
  QB: "QB",
  RB: "RB",
  WR: "WR",
  TE: "TE",
  FLEX: "FLEX",
  SUPER_FLEX: "SUPERFLEX",
  WRRB_FLEX: "FLEX (W/R)",
  REC_FLEX: "FLEX (W/T)",
  WRRB_WRTE_FLEX: "FLEX",
  K: "K",
  DEF: "DEF",
  DL: "DL",
  LB: "LB",
  DB: "DB",
  IDP_FLEX: "IDP FLEX",
  BN: "BENCH",
  IR: "IR",
  TAXI: "TAXI",
};

export function slotLabel(slot: string): string {
  return SLOT_LABELS[slot] ?? slot.replace(/_/g, " ");
}

export interface RosterShape {
  starterSlots: string[];
  benchCount: number;
  irCount: number;
  taxiCount: number;
  startersByPosition: Record<string, number>;
}

export function parseRosterPositions(rosterPositions: string[]): RosterShape {
  const starterSlots: string[] = [];
  let benchCount = 0;
  let irCount = 0;
  let taxiCount = 0;
  const startersByPosition: Record<string, number> = {};

  for (const slot of rosterPositions) {
    if (slot === "BN") {
      benchCount += 1;
      continue;
    }
    if (slot === "IR") {
      irCount += 1;
      continue;
    }
    if (slot === "TAXI") {
      taxiCount += 1;
      continue;
    }
    starterSlots.push(slot);
    startersByPosition[slot] = (startersByPosition[slot] ?? 0) + 1;
  }

  return { starterSlots, benchCount, irCount, taxiCount, startersByPosition };
}

export function eligiblePositionsForSlot(slot: string): string[] {
  switch (slot) {
    case "FLEX":
    case "WRRB_FLEX":
    case "WRRB_WRTE_FLEX":
      return ["RB", "WR", "TE"];
    case "REC_FLEX":
      return ["WR", "TE"];
    case "SUPER_FLEX":
      return ["QB", "RB", "WR", "TE"];
    case "IDP_FLEX":
      return ["DL", "LB", "DB"];
    default:
      return [slot];
  }
}
