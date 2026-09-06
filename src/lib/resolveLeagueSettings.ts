import { LEAGUE_META_REFERENCE, ROSTER_POSITIONS_REFERENCE, SCORING_SETTINGS_REFERENCE } from "../config/leagueReference";
import type { SleeperLeague } from "../types/sleeper";

/**
 * Live Sleeper settings are always preferred; the reference constants only
 * backstop the rare case where the API returns an empty settings object so
 * panels and LLM context never go blank.
 */
export function resolveEffectiveLeague(league: SleeperLeague): SleeperLeague {
  const hasSettings = Object.keys(league.settings ?? {}).length > 0;

  return {
    ...league,
    roster_positions: league.roster_positions?.length ? league.roster_positions : ROSTER_POSITIONS_REFERENCE,
    scoring_settings: Object.keys(league.scoring_settings ?? {}).length
      ? league.scoring_settings
      : SCORING_SETTINGS_REFERENCE,
    settings: hasSettings
      ? league.settings
      : {
          waiver_budget: LEAGUE_META_REFERENCE.waiverBudget,
          trade_deadline: LEAGUE_META_REFERENCE.tradeDeadlineWeek,
          playoff_teams: LEAGUE_META_REFERENCE.playoffTeams,
          playoff_week_start: LEAGUE_META_REFERENCE.playoffStartWeek,
          num_teams: LEAGUE_META_REFERENCE.totalRosters,
        },
  };
}
