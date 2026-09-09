import { detectPprFormat } from "./scoringMatrix";
import { parseRosterPositions } from "./rosterSlots";
import type { DraftTurnInfo } from "./draftTurn";
import { fmtPoints, fptsAgainstFromRoster, fptsFromRoster, injuryBadge, playerDisplayName, record, teamNameForUser } from "./format";
import type {
  SleeperDraft,
  SleeperDraftPick,
  SleeperLeague,
  SleeperMatchup,
  SleeperPlayersMap,
  SleeperRoster,
  SleeperUser,
  TrendingPlayer,
} from "../types/sleeper";

interface BuildContextArgs {
  league: SleeperLeague | undefined;
  users: SleeperUser[] | undefined;
  rosters: SleeperRoster[] | undefined;
  players: SleeperPlayersMap | undefined;
  skynetRoster: SleeperRoster | undefined;
  skynetUser: SleeperUser | undefined;
  currentWeek: number | undefined;
  myMatchup: SleeperMatchup | undefined;
  opponentMatchup: SleeperMatchup | undefined;
  opponentRoster: SleeperRoster | undefined;
  opponentUser: SleeperUser | undefined;
  trendingAdds: TrendingPlayer[] | undefined;
  projections?: Record<string, number>;
}

function projLabel(id: string, projections: Record<string, number> | undefined): string {
  if (!projections) return "";
  const pts = projections[id];
  return typeof pts === "number" ? ` — PROJ ${pts.toFixed(1)}` : " — PROJ n/a";
}

function projTotal(playerIds: string[] | null | undefined, projections: Record<string, number> | undefined): number {
  if (!projections) return 0;
  return (playerIds ?? [])
    .filter((id) => id !== "0")
    .reduce((sum, id) => sum + (projections[id] ?? 0), 0);
}

function rosterPlayerLines(
  playerIds: string[] | null | undefined,
  players: SleeperPlayersMap | undefined,
  projections?: Record<string, number>,
): string {
  const real = (playerIds ?? []).filter((id) => id !== "0");
  if (real.length === 0) return "  (none — empty/pre-draft roster)";
  return real
    .map((id) => {
      const p = players?.[id];
      const name = playerDisplayName(p, id);
      const pos = p?.position ?? "?";
      const team = p?.team ?? "FA";
      const inj = injuryBadge(p?.injury_status);
      const injStr = inj.label ? ` [${inj.label}]` : "";
      return `  - ${name} (${pos}/${team})${injStr}${projLabel(id, projections)}`;
    })
    .join("\n");
}

export function buildLeagueContextSummary(args: BuildContextArgs): string {
  const { league, users, rosters, players, skynetRoster, skynetUser, currentWeek, myMatchup, opponentMatchup, opponentRoster, opponentUser, trendingAdds, projections } = args;

  const lines: string[] = [];

  if (league) {
    lines.push(`LEAGUE: ${league.name} (${league.season} season, ${league.total_rosters} teams)`);
    lines.push(`SCORING FORMAT: ${detectPprFormat(league.scoring_settings)}`);
    lines.push(`ROSTER SLOTS: ${league.roster_positions.join(", ")}`);
    const s = league.settings;
    if (s?.waiver_budget) lines.push(`TOTAL FAAB BUDGET: $${s.waiver_budget}`);
    if (s?.trade_deadline) lines.push(`TRADE DEADLINE: week ${s.trade_deadline}`);
    if (s?.playoff_week_start) lines.push(`PLAYOFFS: top ${s.playoff_teams ?? "?"} teams, start week ${s.playoff_week_start}`);
  }

  if (currentWeek) lines.push(`CURRENT WEEK: ${currentWeek}`);

  if (skynetRoster) {
    lines.push("");
    lines.push(`SKYNET RECORD: ${record(skynetRoster)} | PF ${fmtPoints(fptsFromRoster(skynetRoster))} | PA ${fmtPoints(fptsAgainstFromRoster(skynetRoster))}`);
    if (skynetRoster.settings.waiver_budget_used !== undefined) {
      lines.push(`FAAB USED: $${skynetRoster.settings.waiver_budget_used}`);
    }
    lines.push("SKYNET STARTERS:");
    lines.push(rosterPlayerLines(skynetRoster.starters, players, projections));
    const benchIds = (skynetRoster.players ?? []).filter(
      (id) => !(skynetRoster.starters ?? []).includes(id) && !(skynetRoster.reserve ?? []).includes(id),
    );
    lines.push("SKYNET BENCH:");
    lines.push(rosterPlayerLines(benchIds, players, projections));
    if (skynetRoster.reserve && skynetRoster.reserve.length > 0) {
      lines.push("SKYNET IR:");
      lines.push(rosterPlayerLines(skynetRoster.reserve, players, projections));
    }
    if (projections) {
      lines.push(`SKYNET STARTERS PROJECTED TOTAL (this week, this league's scoring format): ${projTotal(skynetRoster.starters, projections).toFixed(1)}`);
    }
  }

  if (myMatchup) {
    const oppName = opponentUser ? teamNameForUser(opponentUser) : "Unknown Opponent";
    lines.push("");
    lines.push(`THIS WEEK'S MATCHUP: Skynet ${fmtPoints(myMatchup.points)} vs ${oppName} ${fmtPoints(opponentMatchup?.points ?? 0)}`);
    if (opponentRoster) {
      lines.push(`OPPONENT RECORD: ${record(opponentRoster)}`);
      lines.push("OPPONENT STARTERS:");
      lines.push(rosterPlayerLines(opponentMatchup?.starters, players, projections));
      if (projections) {
        lines.push(`OPPONENT STARTERS PROJECTED TOTAL: ${projTotal(opponentMatchup?.starters, projections).toFixed(1)}`);
      }
    }
  }

  if (projections) {
    lines.push("");
    lines.push(
      "PROJ figures above are Sleeper's own weekly fantasy-point projections for this league's scoring format (PPR/half-PPR/standard, whichever matches). They do not capture every custom scoring bonus this league may run, but they are real numeric grounding, not a guess — treat them as authoritative for comparing two specific players and NEVER recommend starting a player over another eligible player at a lower PROJ unless the higher-PROJ one is flagged Q/D/OUT/IR/BYE/PUP/SUSPENDED above.",
    );
  }

  if (skynetUser && rosters && users) {
    lines.push("");
    lines.push("STANDINGS SNAPSHOT:");
    const sorted = [...rosters].sort((a, b) => {
      if (b.settings.wins !== a.settings.wins) return b.settings.wins - a.settings.wins;
      return fptsFromRoster(b) - fptsFromRoster(a);
    });
    sorted.forEach((r, idx) => {
      const u = users.find((u) => u.user_id === r.owner_id);
      const marker = r.roster_id === skynetRoster?.roster_id ? " <-- SKYNET" : "";
      lines.push(`  ${idx + 1}. ${u ? teamNameForUser(u) : "Unknown"} (${record(r)}, ${fmtPoints(fptsFromRoster(r))} PF)${marker}`);
    });
  }

  if (trendingAdds && trendingAdds.length > 0) {
    lines.push("");
    lines.push(
      "TOP LEAGUE-WIDE TRENDING ADDS (last 24h waiver activity — NOT a talent ranking; often surfaces injured/droppable players, use with caution):",
    );
    trendingAdds.slice(0, 12).forEach((t) => {
      const p = players?.[t.player_id];
      const name = playerDisplayName(p, t.player_id);
      const inj = injuryBadge(p?.injury_status);
      const injStr = inj.label ? ` [${inj.label}]` : "";
      lines.push(`  - ${name} (${p?.position ?? "?"}/${p?.team ?? "FA"})${injStr} — added in ${t.count} leagues${projLabel(t.player_id, projections)}`);
    });
  }

  return lines.join("\n");
}

interface DraftContextArgs {
  draft: SleeperDraft | undefined;
  picks: SleeperDraftPick[];
  players: SleeperPlayersMap | undefined;
  users: SleeperUser[] | undefined;
  rosterPositions: string[];
  skynetRosterId: number | undefined;
  turn?: DraftTurnInfo;
}

export function buildDraftContextSummary(args: DraftContextArgs): string {
  const { draft, picks, players, users, rosterPositions, skynetRosterId, turn } = args;
  const lines: string[] = [];

  if (!draft) {
    lines.push("DRAFT STATUS: No draft found for this league/season.");
    return lines.join("\n");
  }

  lines.push(`DRAFT STATUS: ${draft.status.toUpperCase()} (${draft.type}, ${draft.settings.rounds ?? "?"} rounds)`);
  lines.push(`PICKS MADE: ${picks.length}`);
  if (turn) {
    lines.push(
      turn.isSkynetOnTheClock
        ? `SKYNET IS ON THE CLOCK RIGHT NOW: pick ${turn.currentPickNumber} (round ${turn.currentRound}). This recommendation is for THIS pick.`
        : `NOT SKYNET'S TURN YET: currently pick ${turn.currentPickNumber} (round ${turn.currentRound}); Skynet is on the clock in ${turn.picksUntilSkynet ?? "?"} picks. Recommend Skynet's best available target as of right now, understanding the board may shift before Skynet's actual turn.`,
    );
  }

  const shape = parseRosterPositions(rosterPositions);
  lines.push(`REQUIRED STARTING SLOTS: ${Object.entries(shape.startersByPosition).map(([p, n]) => `${p}x${n}`).join(", ")}`);

  const skynetPicks = picks.filter((p) => p.roster_id === skynetRosterId);
  lines.push("");
  lines.push(`SKYNET DRAFT PICKS SO FAR (${skynetPicks.length}):`);
  if (skynetPicks.length === 0) {
    lines.push("  (none yet)");
  } else {
    skynetPicks.forEach((p) => {
      const pos = p.metadata?.position ?? players?.[p.player_id]?.position ?? "?";
      const name = players?.[p.player_id] ? playerDisplayName(players[p.player_id], p.player_id) : `${p.metadata?.first_name ?? ""} ${p.metadata?.last_name ?? ""}`.trim();
      lines.push(`  - Rd ${p.round} Pick ${p.pick_no}: ${name} (${pos})`);
    });
  }

  const draftedByOthers = picks.filter((p) => p.roster_id !== skynetRosterId).length;
  lines.push("");
  lines.push(`PLAYERS DRAFTED BY OTHER TEAMS: ${draftedByOthers} (treat as OFF THE BOARD, never recommend them)`);

  if (users) {
    lines.push("");
    lines.push("RECENT PICKS (last 10, all teams):");
    picks
      .slice(-10)
      .reverse()
      .forEach((p) => {
        const pos = p.metadata?.position ?? players?.[p.player_id]?.position ?? "?";
        const name = players?.[p.player_id] ? playerDisplayName(players[p.player_id], p.player_id) : `${p.metadata?.first_name ?? ""} ${p.metadata?.last_name ?? ""}`.trim();
        lines.push(`  - Pick ${p.pick_no} (Rd ${p.round}): ${name} (${pos})`);
      });
  }

  return lines.join("\n");
}

export interface WebSearchLabels {
  /** e.g. "LIVE ADP WEB SEARCH" */
  label: string;
  /** Sentence describing what this search is the primary source for. */
  primaryUseNote: string;
  /** Sentence describing what to fall back to / flag when no key is configured. */
  noKeyNote: string;
}

export function buildWebSearchContext(
  search: { answer: string | null; results: { title: string; content: string; url: string }[] } | undefined,
  labels: WebSearchLabels,
  error?: string,
): string {
  if (error) {
    return `${labels.label}: FAILED (${error}). Fall back to your own training knowledge and explicitly flag that live data was unavailable.`;
  }
  if (!search) {
    return `${labels.label}: not configured (no Tavily key) — ${labels.noKeyNote}`;
  }

  const lines: string[] = [`${labels.label} RESULTS (fetched just now): ${labels.primaryUseNote}`];
  if (search.answer) lines.push(`SEARCH SUMMARY: ${search.answer}`);
  search.results.slice(0, 8).forEach((r) => {
    lines.push(`- [${r.title}]: ${r.content.slice(0, 500).replace(/\s+/g, " ")}`);
  });
  return lines.join("\n");
}

function teamRosterBlock(
  roster: SleeperRoster,
  label: string,
  players: SleeperPlayersMap | undefined,
  projections: Record<string, number> | undefined,
): string {
  const lines: string[] = [`TEAM: ${label} (${record(roster)}, ${fmtPoints(fptsFromRoster(roster))} PF)`];
  const starterIds = roster.starters ?? [];
  const benchIds = (roster.players ?? []).filter((id) => !starterIds.includes(id) && !(roster.reserve ?? []).includes(id));
  lines.push("  STARTERS:");
  lines.push(
    rosterPlayerLines(starterIds, players, projections)
      .split("\n")
      .map((l) => `  ${l}`)
      .join("\n"),
  );
  lines.push("  BENCH:");
  lines.push(
    rosterPlayerLines(benchIds, players, projections)
      .split("\n")
      .map((l) => `  ${l}`)
      .join("\n"),
  );
  if (projections) {
    lines.push(`  STARTERS PROJECTED TOTAL: ${projTotal(starterIds, projections).toFixed(1)}`);
  }
  return lines.join("\n");
}

/**
 * Every roster in the league, in full — needed for Trade Desk mode to spot
 * positional surplus/scarcity across teams. Not used by lineup/waiver/draft
 * modes, which only need Skynet + this week's opponent, to keep context lean.
 */
export function buildAllRostersSummary(
  rosters: SleeperRoster[] | undefined,
  users: SleeperUser[] | undefined,
  players: SleeperPlayersMap | undefined,
  skynetRosterId: number | undefined,
  projections: Record<string, number> | undefined,
): string {
  if (!rosters || rosters.length === 0) return "";
  const lines: string[] = ["ALL LEAGUE ROSTERS (for trade target scouting):"];
  rosters.forEach((r) => {
    const u = users?.find((u) => u.user_id === r.owner_id);
    const label = `${u ? teamNameForUser(u) : "Unknown"}${r.roster_id === skynetRosterId ? " <-- SKYNET" : ""}`;
    lines.push("");
    lines.push(teamRosterBlock(r, label, players, projections));
  });
  return lines.join("\n");
}
