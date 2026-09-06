/**
 * Known-good snapshot of THE FAMILY's roster/scoring settings, confirmed
 * against the Sleeper league settings page on 2026-09-06 (pre-draft).
 *
 * This is a FALLBACK ONLY. The app always prefers the live values from
 * `GET /league/{id}` (see services/sleeper.ts) so it stays correct if the
 * commish changes settings later in the season — this snapshot exists so
 * the UI never renders blank/confusing panels if that live fetch ever
 * returns an empty settings object.
 */

export const ROSTER_POSITIONS_REFERENCE: string[] = [
  "QB",
  "QB",
  "RB",
  "RB",
  "WR",
  "WR",
  "WR",
  "TE",
  "FLEX",
  "FLEX",
  "FLEX",
  "K",
  "DEF",
  "BN",
  "BN",
  "BN",
  "BN",
  "BN",
  "BN",
  "BN",
];

export const SCORING_SETTINGS_REFERENCE: Record<string, number> = {
  // Passing
  pass_yd: 0.04,
  pass_td: 4,
  pass_2pt: 2,
  pass_int: -1,
  // Rushing
  rush_yd: 0.1,
  rush_td: 6,
  rush_2pt: 2,
  // Receiving
  rec: 1,
  rec_yd: 0.1,
  rec_td: 6,
  rec_2pt: 2,
  // Kicking
  fgm_0_19: 3,
  fgm_20_29: 3,
  fgm_30_39: 3,
  fgm_40_49: 4,
  fgm_50_59: 5,
  fgm_60p: 6,
  xpm: 1,
  fgmiss: -1,
  xpmiss: -1,
  // Team defense
  def_td: 6,
  pts_allow_0: 10,
  pts_allow_1_6: 7,
  pts_allow_7_13: 4,
  pts_allow_14_20: 1,
  pts_allow_28_34: -1,
  pts_allow_35p: -4,
  sack: 1,
  int: 2,
  fum_rec: 2,
  safe: 2,
  ff: 1,
  blk_kick: 2,
  // Special teams defense / ST player
  st_td: 6,
  st_ff: 1,
  st_fum_rec: 1,
  def_st_td: 6,
  def_st_ff: 1,
  def_st_fum_rec: 1,
  // Misc
  fum_lost: -2,
  fum_rec_td: 6,
};

export const LEAGUE_META_REFERENCE = {
  totalRosters: 8,
  playoffTeams: 6,
  playoffStartWeek: 15,
  waiverType: "FAAB",
  waiverBudget: 200,
  waiverClearDay: "Wednesday 2:00 AM CDT",
  waiverDaysOnWire: 2,
  tradeDeadlineWeek: 11,
  irSlots: 0,
  draftPickTradingAllowed: true,
} as const;
