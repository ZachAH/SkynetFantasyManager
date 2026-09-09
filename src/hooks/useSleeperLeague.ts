import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { LEAGUE_ID, SKYNET_USERNAME } from "../config/constants";
import { sleeperApi } from "../services/sleeper";
import { getWeeklyProjections, pprKeyForScoring } from "../services/projections";

const STALE_SHORT = 1000 * 30; // 30s — live scoring during games
const STALE_MEDIUM = 1000 * 60 * 5; // 5min — league/roster metadata
const STALE_LONG = 1000 * 60 * 60 * 12; // 12h — players dictionary, trending

export function useLeague(leagueId: string = LEAGUE_ID) {
  return useQuery({
    queryKey: ["league", leagueId],
    queryFn: () => sleeperApi.getLeague(leagueId),
    staleTime: STALE_MEDIUM,
  });
}

export function useLeagueUsers(leagueId: string = LEAGUE_ID) {
  return useQuery({
    queryKey: ["league-users", leagueId],
    queryFn: () => sleeperApi.getUsers(leagueId),
    staleTime: STALE_MEDIUM,
  });
}

export function useLeagueRosters(leagueId: string = LEAGUE_ID) {
  return useQuery({
    queryKey: ["league-rosters", leagueId],
    queryFn: () => sleeperApi.getRosters(leagueId),
    staleTime: STALE_SHORT,
    refetchInterval: STALE_SHORT,
  });
}

export function useNflState() {
  return useQuery({
    queryKey: ["nfl-state"],
    queryFn: () => sleeperApi.getNflState(),
    staleTime: STALE_MEDIUM,
  });
}

export function useMatchups(week: number | undefined, leagueId: string = LEAGUE_ID) {
  return useQuery({
    queryKey: ["matchups", leagueId, week],
    queryFn: () => sleeperApi.getMatchups(week as number, leagueId),
    enabled: typeof week === "number" && week > 0,
    staleTime: STALE_SHORT,
    refetchInterval: STALE_SHORT,
  });
}

export function useTrendingAdds(limit = 25) {
  return useQuery({
    queryKey: ["trending-add", limit],
    queryFn: () => sleeperApi.getTrendingAdds(24, limit),
    staleTime: STALE_LONG,
  });
}

export function useTrendingDrops(limit = 25) {
  return useQuery({
    queryKey: ["trending-drop", limit],
    queryFn: () => sleeperApi.getTrendingDrops(24, limit),
    staleTime: STALE_LONG,
  });
}

/**
 * Weekly fantasy-point projections keyed by player_id, in this league's own
 * scoring format (PPR/half-PPR/standard). Grounds the AI console's lineup and
 * waiver recommendations in actual numbers instead of name-recognition guesses.
 */
export function useWeeklyProjections(
  season: string | undefined,
  week: number | undefined,
  scoringSettings: Record<string, number> | undefined,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ["weekly-projections", season, week, scoringSettings ? pprKeyForScoring(scoringSettings) : undefined],
    queryFn: () => getWeeklyProjections(season as string, week as number, pprKeyForScoring(scoringSettings ?? {})),
    enabled: enabled && Boolean(season) && typeof week === "number" && week > 0 && Boolean(scoringSettings),
    staleTime: 1000 * 60 * 30,
  });
}

export function useAllPlayers() {
  return useQuery({
    queryKey: ["players-nfl"],
    queryFn: () => sleeperApi.getAllPlayers(),
    staleTime: STALE_LONG,
    gcTime: STALE_LONG * 2,
  });
}

/**
 * Composite hook: resolves the Skynet AI GM's user record and roster from
 * the league's user/roster lists by matching the target username.
 */
export function useSkynetGM(leagueId: string = LEAGUE_ID) {
  const usersQuery = useLeagueUsers(leagueId);
  const rostersQuery = useLeagueRosters(leagueId);

  const skynetUser = useMemo(() => {
    const target = SKYNET_USERNAME.toLowerCase();
    // Sleeper's public /users endpoint returns username as null for privacy;
    // display_name is the only reliably populated identifier, so match both.
    return usersQuery.data?.find(
      (u) => u.username?.toLowerCase() === target || u.display_name?.toLowerCase() === target,
    );
  }, [usersQuery.data]);

  const skynetRoster = useMemo(() => {
    if (!skynetUser) return undefined;
    return rostersQuery.data?.find((r) => r.owner_id === skynetUser.user_id);
  }, [rostersQuery.data, skynetUser]);

  return {
    user: skynetUser,
    roster: skynetRoster,
    isLoading: usersQuery.isLoading || rostersQuery.isLoading,
    isError: usersQuery.isError || rostersQuery.isError,
    error: usersQuery.error ?? rostersQuery.error,
    notFound: !usersQuery.isLoading && !skynetUser,
  };
}
