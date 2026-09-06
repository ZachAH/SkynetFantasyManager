export interface ScoringRow {
  key: string;
  label: string;
  value: number;
}

export interface ScoringGroup {
  name: string;
  rows: ScoringRow[];
}

const LABELS: Record<string, string> = {
  pass_yd: "Pass Yard",
  pass_td: "Pass TD",
  pass_int: "Interception Thrown",
  pass_2pt: "Pass 2PT",
  pass_cmp: "Completion",
  pass_inc: "Incompletion",
  pass_td_40p: "Pass TD 40+ yds",
  pass_td_50p: "Pass TD 50+ yds",

  rush_yd: "Rush Yard",
  rush_td: "Rush TD",
  rush_2pt: "Rush 2PT",
  rush_att: "Rush Attempt",
  rush_td_40p: "Rush TD 40+ yds",

  rec: "Reception (PPR)",
  rec_yd: "Reception Yard",
  rec_td: "Reception TD",
  rec_2pt: "Reception 2PT",
  bonus_rec_te: "TE Reception Bonus",
  rec_td_40p: "Rec TD 40+ yds",
  rec_0_4: "Reception 0-4 yds",
  rec_5_9: "Reception 5-9 yds",

  fum: "Fumble",
  fum_lost: "Fumble Lost",
  fum_rec_td: "Fumble Recovery TD",

  st_td: "Special Teams TD",
  st_fum_rec: "ST Fumble Recovery",
  st_ff: "ST Forced Fumble",

  def_td: "Defensive TD",
  def_st_td: "Def/ST TD",
  def_st_ff: "Def/ST Forced Fumble",
  def_st_fum_rec: "Def/ST Fumble Rec",
  sack: "Sack",
  int: "Interception (Def)",
  fum_rec: "Fumble Recovery",
  safe: "Safety",
  blk_kick: "Blocked Kick",
  ff: "Forced Fumble",
  tkl_loss: "Tackle for Loss",

  pts_allow_0: "Points Allowed: 0",
  pts_allow_1_6: "Points Allowed: 1-6",
  pts_allow_7_13: "Points Allowed: 7-13",
  pts_allow_14_20: "Points Allowed: 14-20",
  pts_allow_21_27: "Points Allowed: 21-27",
  pts_allow_28_34: "Points Allowed: 28-34",
  pts_allow_35p: "Points Allowed: 35+",

  fgm_0_19: "FG Made 0-19",
  fgm_20_29: "FG Made 20-29",
  fgm_30_39: "FG Made 30-39",
  fgm_40_49: "FG Made 40-49",
  fgm_50p: "FG Made 50+",
  fgm_50_59: "FG Made 50-59",
  fgm_60p: "FG Made 60+",
  fgmiss: "FG Missed",
  xpm: "Extra Point Made",
  xpmiss: "Extra Point Missed",
};

const GROUP_MATCHERS: { name: string; test: (key: string) => boolean }[] = [
  { name: "Passing", test: (k) => k.startsWith("pass_") },
  { name: "Rushing", test: (k) => k.startsWith("rush_") },
  { name: "Receiving", test: (k) => k.startsWith("rec") || k === "bonus_rec_te" },
  { name: "Fumbles", test: (k) => k.startsWith("fum") },
  { name: "Kicking", test: (k) => k.startsWith("fg") || k.startsWith("xp") },
  {
    name: "Defense / Special Teams",
    test: (k) => k.startsWith("def_") || k.startsWith("st_") || k.startsWith("pts_allow") || ["sack", "int", "fum_rec", "safe", "blk_kick", "ff", "tkl_loss"].includes(k),
  },
];

export function humanizeScoringKey(key: string): string {
  return LABELS[key] ?? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function buildScoringMatrix(scoringSettings: Record<string, number>): ScoringGroup[] {
  const groups: ScoringGroup[] = GROUP_MATCHERS.map((g) => ({ name: g.name, rows: [] }));
  const other: ScoringRow[] = [];

  for (const [key, value] of Object.entries(scoringSettings)) {
    if (value === 0) continue;
    const row: ScoringRow = { key, label: humanizeScoringKey(key), value };
    const group = GROUP_MATCHERS.find((g) => g.test(key));
    if (group) {
      groups.find((g) => g.name === group.name)!.rows.push(row);
    } else {
      other.push(row);
    }
  }

  if (other.length) groups.push({ name: "Other", rows: other });

  return groups.filter((g) => g.rows.length > 0).map((g) => ({
    ...g,
    rows: g.rows.sort((a, b) => b.value - a.value),
  }));
}

export function detectPprFormat(scoringSettings: Record<string, number>): string {
  const rec = scoringSettings.rec ?? 0;
  if (rec >= 1) return "Full PPR";
  if (rec >= 0.5) return "Half PPR";
  if (rec > 0) return `${rec} PPR`;
  return "Standard (Non-PPR)";
}
