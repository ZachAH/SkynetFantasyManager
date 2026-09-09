import { SLEEPER_ROOT_URL } from "../config/constants";

export type PprKey = "pts_ppr" | "pts_half_ppr" | "pts_std";

export function pprKeyForScoring(scoringSettings: Record<string, number>): PprKey {
  const rec = scoringSettings.rec ?? 0;
  if (rec >= 1) return "pts_ppr";
  if (rec >= 0.5) return "pts_half_ppr";
  return "pts_std";
}

interface RawProjectionEntry {
  player_id: string;
  stats?: Record<string, number> | null;
}

/**
 * Sleeper's public players/leagues API has no documented projections endpoint,
 * but this one (used by most third-party Sleeper tools) returns the full
 * league-wide weekly projection set. It's ~5-6MB uncompressed, so callers
 * should cache the trimmed player_id -> points map rather than the raw payload.
 */
async function fetchRawProjections(season: string, week: number): Promise<RawProjectionEntry[]> {
  const res = await fetch(`${SLEEPER_ROOT_URL}/projections/nfl/${season}/${week}?season_type=regular`);
  if (!res.ok) {
    throw new Error(`Projections request failed (${res.status})`);
  }
  return (await res.json()) as RawProjectionEntry[];
}

export async function getWeeklyProjections(
  season: string,
  week: number,
  pprKey: PprKey,
): Promise<Record<string, number>> {
  const CACHE_KEY = `skynet.proj.${season}.${week}.${pprKey}.v1`;
  const TTL = 1000 * 60 * 60 * 3; // 3h — projections shift through the week with injury news

  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as { ts: number; map: Record<string, number> };
      if (Date.now() - parsed.ts < TTL) return parsed.map;
    }
  } catch {
    // sessionStorage unavailable or corrupt cache; fall through to network fetch
  }

  const raw = await fetchRawProjections(season, week);
  const map: Record<string, number> = {};
  for (const entry of raw) {
    const pts = entry.stats?.[pprKey];
    if (typeof pts === "number") map[entry.player_id] = pts;
  }

  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), map }));
  } catch {
    // storage quota exceeded; app still works without persisting cache
  }

  return map;
}
