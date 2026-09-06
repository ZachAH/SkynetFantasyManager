import { useQuery } from "@tanstack/react-query";
import { LEAGUE_ID } from "../config/constants";
import { sleeperApi } from "../services/sleeper";

export function useLeagueDrafts(leagueId: string = LEAGUE_ID) {
  return useQuery({
    queryKey: ["league-drafts", leagueId],
    queryFn: () => sleeperApi.getDrafts(leagueId),
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 30,
  });
}

export function useDraftPicks(draftId: string | undefined, pollMs = 1000 * 30) {
  return useQuery({
    queryKey: ["draft-picks", draftId],
    queryFn: () => sleeperApi.getDraftPicks(draftId as string),
    enabled: Boolean(draftId),
    staleTime: pollMs,
    refetchInterval: (query) => (query.state.data ? pollMs : false),
  });
}

/**
 * Resolves the league's most relevant draft: prefer one currently in
 * progress, otherwise the most recent by season. Polls picks every 8s while
 * a draft is actually live so the on-the-clock tracker stays current.
 */
export function useCurrentDraft(leagueId: string = LEAGUE_ID) {
  const draftsQuery = useLeagueDrafts(leagueId);

  const drafts = draftsQuery.data ?? [];
  const active = drafts.find((d) => d.status === "drafting" || d.status === "paused");
  const mostRecent = [...drafts].sort((a, b) => Number(b.season) - Number(a.season))[0];
  const target = active ?? mostRecent;

  const picksQuery = useDraftPicks(target?.draft_id, target?.status === "drafting" ? 1000 * 8 : 1000 * 30);

  return {
    draft: target,
    picks: picksQuery.data ?? [],
    isLoading: draftsQuery.isLoading || (Boolean(target) && picksQuery.isLoading),
    isError: draftsQuery.isError || picksQuery.isError,
  };
}
