import { useMemo } from "react";
import { LEAGUE_ID } from "../config/constants";
import { computeDraftTurn } from "../lib/draftTurn";
import { useCurrentDraft } from "./useLeagueDraft";
import { useLeagueRosters, useLeagueUsers, useSkynetGM } from "./useSleeperLeague";

export function useDraftTurn(leagueId: string = LEAGUE_ID) {
  const draftState = useCurrentDraft(leagueId);
  const skynet = useSkynetGM(leagueId);
  const usersQuery = useLeagueUsers(leagueId);
  const rostersQuery = useLeagueRosters(leagueId);

  const turn = useMemo(
    () => computeDraftTurn(draftState.draft, draftState.picks, skynet.user?.user_id),
    [draftState.draft, draftState.picks, skynet.user?.user_id],
  );

  const onTheClockUser = useMemo(() => {
    if (!turn?.onTheClockUserId) return undefined;
    return usersQuery.data?.find((u) => u.user_id === turn.onTheClockUserId);
  }, [turn?.onTheClockUserId, usersQuery.data]);

  return {
    draft: draftState.draft,
    turn,
    onTheClockUser,
    isDraftLive: draftState.draft?.status === "drafting",
    isLoading: draftState.isLoading || usersQuery.isLoading || rostersQuery.isLoading,
  };
}
