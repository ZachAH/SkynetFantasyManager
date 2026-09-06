export interface SleeperNflState {
  week: number;
  season_type: "pre" | "regular" | "post" | "off";
  season: string;
  previous_season: string;
  leg: number;
  display_week: number;
}

export interface RosterPositionsSummary {
  starters: string[];
  bench: number;
  ir: number;
  taxi: number;
}

export interface SleeperLeague {
  league_id: string;
  name: string;
  season: string;
  season_type: string;
  status: string;
  sport: string;
  total_rosters: number;
  roster_positions: string[];
  scoring_settings: Record<string, number>;
  settings: Record<string, number>;
  previous_league_id: string | null;
  avatar: string | null;
}

export interface SleeperUser {
  user_id: string;
  username: string | null;
  display_name: string;
  avatar: string | null;
  metadata: {
    team_name?: string;
    [key: string]: unknown;
  } | null;
  is_owner?: boolean;
}

export interface SleeperRosterSettings {
  wins: number;
  losses: number;
  ties: number;
  fpts: number;
  fpts_decimal: number;
  fpts_against: number;
  fpts_against_decimal: number;
  waiver_position?: number;
  waiver_budget_used?: number;
  total_moves?: number;
}

export interface SleeperRoster {
  roster_id: number;
  owner_id: string | null;
  co_owners: string[] | null;
  league_id: string;
  players: string[] | null;
  starters: string[] | null;
  reserve: string[] | null;
  taxi: string[] | null;
  settings: SleeperRosterSettings;
  metadata: Record<string, string> | null;
}

export interface SleeperMatchup {
  roster_id: number;
  matchup_id: number | null;
  points: number;
  starters: string[];
  starters_points?: number[];
  players: string[];
  players_points?: Record<string, number>;
  custom_points: number | null;
}

export interface SleeperPlayer {
  player_id: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  team: string | null;
  position: string | null;
  fantasy_positions: string[] | null;
  status: string | null;
  injury_status: string | null;
  injury_body_part?: string | null;
  age: number | null;
  years_exp: number | null;
  number: number | null;
  depth_chart_order: number | null;
  search_rank: number | null;
}

export type SleeperPlayersMap = Record<string, SleeperPlayer>;

export interface TrendingPlayer {
  player_id: string;
  count: number;
}

export interface SleeperDraft {
  draft_id: string;
  league_id: string;
  status: "pre_draft" | "drafting" | "paused" | "complete";
  type: string;
  start_time: number | null;
  season: string;
  settings: {
    rounds?: number;
    teams?: number;
    [key: string]: unknown;
  };
  draft_order: Record<string, number> | null;
}

export interface SleeperDraftPick {
  pick_no: number;
  round: number;
  roster_id: number;
  player_id: string;
  picked_by: string;
  draft_slot: number;
  metadata: {
    first_name?: string;
    last_name?: string;
    position?: string;
    team?: string;
    [key: string]: unknown;
  };
}

export interface SleeperTransaction {
  transaction_id: string;
  type: "trade" | "waiver" | "free_agent";
  status: string;
  roster_ids: number[];
  adds: Record<string, number> | null;
  drops: Record<string, number> | null;
  waiver_budget?: { sender: number; receiver: number; amount: number }[];
  created: number;
}
