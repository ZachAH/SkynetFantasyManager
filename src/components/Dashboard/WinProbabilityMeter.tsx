interface Props {
  probability: number; // 0-1, from Skynet's perspective
  myLabel?: string;
  oppLabel?: string;
}

export function WinProbabilityMeter({ probability, myLabel = "SKYNET", oppLabel = "OPPONENT" }: Props) {
  const pct = Math.round(probability * 100);
  const oppPct = 100 - pct;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between font-mono text-[10px] tracking-wider text-text-dim">
        <span className="text-good">{myLabel} {pct}%</span>
        <span className="text-text-faint">WIN PROBABILITY</span>
        <span className="text-crit">{oppPct}% {oppLabel}</span>
      </div>
      <div className="relative h-3 w-full overflow-hidden border border-line-bright bg-panel">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-good/70 to-good transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute inset-y-0 right-0 bg-gradient-to-l from-crit/70 to-crit transition-all duration-700"
          style={{ width: `${oppPct}%` }}
        />
      </div>
    </div>
  );
}
