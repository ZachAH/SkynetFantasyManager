import { SLEEPER_CDN_AVATAR, SLEEPER_CDN_PLAYER_IMG } from "../config/constants";
import type { SleeperPlayer, SleeperRoster } from "../types/sleeper";

export function fmtPoints(points: number | undefined | null): string {
  if (points === undefined || points === null || Number.isNaN(points)) return "0.00";
  return points.toFixed(2);
}

export function fptsFromRoster(roster: SleeperRoster): number {
  return roster.settings.fpts + roster.settings.fpts_decimal / 100;
}

export function fptsAgainstFromRoster(roster: SleeperRoster): number {
  return roster.settings.fpts_against + roster.settings.fpts_against_decimal / 100;
}

export function record(roster: SleeperRoster): string {
  const { wins, losses, ties } = roster.settings;
  return ties > 0 ? `${wins}-${losses}-${ties}` : `${wins}-${losses}`;
}

export function isEmptySlot(playerId: string): boolean {
  return playerId === "0";
}

export function playerDisplayName(player: SleeperPlayer | undefined, playerId: string): string {
  if (isEmptySlot(playerId)) return "— empty slot —";
  if (!player) return playerId;
  if (player.position === "DEF") return `${player.team} D/ST`;
  return player.full_name ?? `${player.first_name} ${player.last_name}`;
}

export function playerHeadshotUrl(playerId: string): string {
  return `${SLEEPER_CDN_PLAYER_IMG}/${playerId}.jpg`;
}

export function avatarUrl(avatar: string | null): string | null {
  if (!avatar) return null;
  return `${SLEEPER_CDN_AVATAR}/${avatar}`;
}

export function teamNameForUser(user: { display_name: string; metadata: { team_name?: string } | null }): string {
  return user.metadata?.team_name?.trim() || user.display_name;
}

export function injuryBadge(status: string | null | undefined): { label: string; tone: "crit" | "warn" | "none" } {
  if (!status) return { label: "", tone: "none" };
  const s = status.toUpperCase();
  if (["OUT", "IR", "PUP", "SUSPENDED", "NA"].includes(s)) return { label: s, tone: "crit" };
  if (["DOUBTFUL", "QUESTIONABLE", "D", "Q"].includes(s)) return { label: s, tone: "warn" };
  return { label: s, tone: "none" };
}

export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}
