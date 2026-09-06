import { useLeague, useLeagueRosters, useLeagueUsers, useAllPlayers, useSkynetGM } from "../../hooks/useSleeperLeague";
import { useSkynetMatchup } from "../../hooks/useSkynetMatchup";
import { RosterCard } from "./RosterCard";
import { StandingsTable } from "./StandingsTable";
import { MatchupTelemetry } from "./MatchupTelemetry";
import { ScoringMatrixCard } from "./ScoringMatrixCard";
import { CommishExport } from "./CommishExport";
import { LoadingState, ErrorState } from "../UI/LoadingState";
import { resolveEffectiveLeague } from "../../lib/resolveLeagueSettings";

export function WarRoomDashboard() {
  const leagueQuery = useLeague();
  const usersQuery = useLeagueUsers();
  const rostersQuery = useLeagueRosters();
  const playersQuery = useAllPlayers();
  const skynet = useSkynetGM();
  const matchup = useSkynetMatchup();

  if (leagueQuery.isLoading || usersQuery.isLoading || rostersQuery.isLoading) {
    return <LoadingState label="ESTABLISHING UPLINK TO SLEEPER MAINFRAME..." />;
  }

  if (leagueQuery.isError || usersQuery.isError || rostersQuery.isError) {
    return <ErrorState message="Failed to reach Sleeper API. The league ID may be invalid, or the network is unreachable." />;
  }

  if (skynet.notFound) {
    return (
      <ErrorState message={`No league member found with username "Skynet089197". Verify the account has joined this league.`} />
    );
  }

  const users = usersQuery.data!;
  const rosters = rostersQuery.data!;
  const league = resolveEffectiveLeague(leagueQuery.data!);

  return (
    <div className="space-y-4">
      {playersQuery.isLoading && <LoadingState label="LOADING NFL PLAYER DATABASE..." />}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          {skynet.roster ? (
            <RosterCard
              roster={skynet.roster}
              players={playersQuery.data}
              rosterPositions={league.roster_positions}
              matchup={matchup.myMatchup}
            />
          ) : (
            <ErrorState message="Skynet has no roster in this league yet." />
          )}
        </div>

        <div className="space-y-4 lg:col-span-2">
          <MatchupTelemetry
            week={matchup.week}
            myMatchup={matchup.myMatchup}
            opponentMatchup={matchup.opponentMatchup}
            opponentUser={matchup.opponentUser}
            mySeasonAvg={matchup.mySeasonAvg}
            oppSeasonAvg={matchup.oppSeasonAvg}
          />
          <StandingsTable rosters={rosters} users={users} skynetRosterId={skynet.roster?.roster_id} />
        </div>
      </div>

      <ScoringMatrixCard league={league} />

      <CommishExport />
    </div>
  );
}
