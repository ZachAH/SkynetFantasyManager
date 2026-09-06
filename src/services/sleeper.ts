import { LEAGUE_ID, SLEEPER_BASE_URL } from "../config/constants";
import type {
  SleeperDraft,
  SleeperDraftPick,
  SleeperLeague,
  SleeperMatchup,
  SleeperNflState,
  SleeperPlayersMap,
  SleeperRoster,
  SleeperTransaction,
  SleeperUser,
  TrendingPlayer,
} from "../types/sleeper";

class SleeperApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "SleeperApiError";
    this.status = status;
  }
}

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${SLEEPER_BASE_URL}${path}`);
  if (!res.ok) {
    throw new SleeperApiError(`Sleeper API request failed: ${path} (${res.status})`, res.status);
  }
  return (await res.json()) as T;
}

export const sleeperApi = {
  getLeague: (leagueId: string = LEAGUE_ID) => request<SleeperLeague>(`/league/${leagueId}`),

  getUsers: (leagueId: string = LEAGUE_ID) => request<SleeperUser[]>(`/league/${leagueId}/users`),

  getRosters: (leagueId: string = LEAGUE_ID) => request<SleeperRoster[]>(`/league/${leagueId}/rosters`),

  getNflState: () => request<SleeperNflState>(`/state/nfl`),

  getMatchups: (week: number, leagueId: string = LEAGUE_ID) =>
    request<SleeperMatchup[]>(`/league/${leagueId}/matchups/${week}`),

  getTrendingAdds: (lookbackHours = 24, limit = 25) =>
    request<TrendingPlayer[]>(`/players/nfl/trending/add?lookback_hours=${lookbackHours}&limit=${limit}`),

  getTrendingDrops: (lookbackHours = 24, limit = 25) =>
    request<TrendingPlayer[]>(`/players/nfl/trending/drop?lookback_hours=${lookbackHours}&limit=${limit}`),

  getTransactions: (round: number, leagueId: string = LEAGUE_ID) =>
    request<SleeperTransaction[]>(`/league/${leagueId}/transactions/${round}`),

  getDrafts: (leagueId: string = LEAGUE_ID) => request<SleeperDraft[]>(`/league/${leagueId}/drafts`),

  getDraftPicks: (draftId: string) => request<SleeperDraftPick[]>(`/draft/${draftId}/picks`),

  /**
   * The full NFL players dictionary is ~5MB and Sleeper asks clients to cache
   * it (at most once per day) rather than refetch per-session. We persist it
   * in localStorage with a timestamp.
   */
  getAllPlayers: async (): Promise<SleeperPlayersMap> => {
    const CACHE_KEY = "skynet.players.nfl.v1";
    const CACHE_META_KEY = "skynet.players.nfl.v1.ts";
    const ONE_DAY = 1000 * 60 * 60 * 24;

    try {
      const cachedTs = localStorage.getItem(CACHE_META_KEY);
      if (cachedTs && Date.now() - Number(cachedTs) < ONE_DAY) {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) return JSON.parse(cached) as SleeperPlayersMap;
      }
    } catch {
      // localStorage unavailable or corrupt cache; fall through to network fetch
    }

    const data = await request<SleeperPlayersMap>(`/players/nfl`);

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(CACHE_META_KEY, String(Date.now()));
    } catch {
      // storage quota exceeded; app still works without persisting cache
    }

    return data;
  },
};

export { SleeperApiError };
