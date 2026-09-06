import { useMemo } from "react";
import { LEAGUE_ID } from "../config/constants";
import { useLeagueRosters, useLeagueUsers, useMatchups, useNflState, useSkynetGM } from "./useSleeperLeague";
import { fptsFromRoster } from "../lib/format";

export function useSkynetMatchup(leagueId: string = LEAGUE_ID) {
  const nflState = useNflState();
  const skynet = useSkynetGM(leagueId);
  const usersQuery = useLeagueUsers(leagueId);
  const rostersQuery = useLeagueRosters(leagueId);

  const week = nflState.data?.week;
  const matchupsQuery = useMatchups(week, leagueId);

  const mine = useMemo(() => {
    if (!skynet.roster) return undefined;
    return matchupsQuery.data?.find((m) => m.roster_id === skynet.roster!.roster_id);
  }, [matchupsQuery.data, skynet.roster]);

  const opponent = useMemo(() => {
    if (!mine || mine.matchup_id === null) return undefined;
    return matchupsQuery.data?.find((m) => m.matchup_id === mine.matchup_id && m.roster_id !== mine.roster_id);
  }, [matchupsQuery.data, mine]);

  const opponentRoster = useMemo(() => {
    if (!opponent) return undefined;
    return rostersQuery.data?.find((r) => r.roster_id === opponent.roster_id);
  }, [opponent, rostersQuery.data]);

  const opponentUser = useMemo(() => {
    if (!opponentRoster) return undefined;
    return usersQuery.data?.find((u) => u.user_id === opponentRoster.owner_id);
  }, [opponentRoster, usersQuery.data]);

  const gamesCompleted = skynet.roster
    ? skynet.roster.settings.wins + skynet.roster.settings.losses + skynet.roster.settings.ties
    : 0;

  const mySeasonAvg = skynet.roster && gamesCompleted > 0 ? fptsFromRoster(skynet.roster) / gamesCompleted : 0;
  const oppSeasonAvg = opponentRoster && gamesCompleted > 0 ? fptsFromRoster(opponentRoster) / gamesCompleted : 0;

  return {
    week,
    myMatchup: mine,
    opponentMatchup: opponent,
    opponentRoster,
    opponentUser,
    mySeasonAvg,
    oppSeasonAvg,
    isLoading: nflState.isLoading || skynet.isLoading || matchupsQuery.isLoading,
    isError: nflState.isError || skynet.isError || matchupsQuery.isError,
  };
}
