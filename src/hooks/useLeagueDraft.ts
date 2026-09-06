import { useQuery } from "@tanstack/react-query";
import { LEAGUE_ID } from "../config/constants";
import { sleeperApi } from "../services/sleeper";

export function useLeagueDrafts(leagueId: string = LEAGUE_ID) {
  return useQuery({
    queryKey: ["league-drafts", leagueId],
    queryFn: () => sleeperApi.getDrafts(leagueId),
    staleTime: 1000 * 60 * 5,
  });
}

export function useDraftPicks(draftId: string | undefined) {
  return useQuery({
    queryKey: ["draft-picks", draftId],
    queryFn: () => sleeperApi.getDraftPicks(draftId as string),
    enabled: Boolean(draftId),
    staleTime: 1000 * 30,
    refetchInterval: (query) => (query.state.data ? 1000 * 30 : false),
  });
}

/**
 * Resolves the league's most relevant draft: prefer one currently in
 * progress, otherwise the most recent by season.
 */
export function useCurrentDraft(leagueId: string = LEAGUE_ID) {
  const draftsQuery = useLeagueDrafts(leagueId);

  const drafts = draftsQuery.data ?? [];
  const active = drafts.find((d) => d.status === "drafting" || d.status === "paused");
  const mostRecent = [...drafts].sort((a, b) => Number(b.season) - Number(a.season))[0];
  const target = active ?? mostRecent;

  const picksQuery = useDraftPicks(target?.draft_id);

  return {
    draft: target,
    picks: picksQuery.data ?? [],
    isLoading: draftsQuery.isLoading || (Boolean(target) && picksQuery.isLoading),
    isError: draftsQuery.isError || picksQuery.isError,
  };
}
