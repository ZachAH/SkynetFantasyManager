/**
 * Heuristic win-probability estimate. Sleeper doesn't expose Vegas-style win
 * odds, so this blends current live-score differential with each team's
 * season scoring average into a logistic curve. It's a directional signal
 * for the HUD, not a sportsbook line.
 */
export function estimateWinProbability(params: {
  myLivePoints: number;
  oppLivePoints: number;
  mySeasonAvg: number;
  oppSeasonAvg: number;
  gamesCompleted: number; // 0 = pregame, ~1 = fully final
}): number {
  const { myLivePoints, oppLivePoints, mySeasonAvg, oppSeasonAvg, gamesCompleted } = params;

  const liveDiff = myLivePoints - oppLivePoints;
  const seasonDiff = mySeasonAvg - oppSeasonAvg;

  const liveWeight = Math.min(Math.max(gamesCompleted, 0), 1);
  const seasonWeight = 1 - liveWeight * 0.7;

  const blended = liveDiff * liveWeight * 1.4 + seasonDiff * seasonWeight * 0.55;

  const k = 0.16;
  const prob = 1 / (1 + Math.exp(-k * blended));

  return Math.min(0.98, Math.max(0.02, prob));
}
