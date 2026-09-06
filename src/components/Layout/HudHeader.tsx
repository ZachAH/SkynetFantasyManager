import { useEffect, useState } from "react";
import { Skull } from "lucide-react";
import { useLeague, useNflState } from "../../hooks/useSleeperLeague";

export function HudHeader() {
  const league = useLeague();
  const nflState = useNflState();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="border-b border-line-bright bg-panel">
      <div className="relative overflow-hidden">
        <div className="animate-scan absolute inset-x-0 h-px bg-red-glow/60" />
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Skull size={22} className="text-red-glow animate-flicker" strokeWidth={1.75} />
            <div>
              <h1 className="font-display text-sm font-black tracking-[0.15em] text-text-primary sm:text-base">
                SKYNET <span className="text-red-glow text-glow">FANTASY GM</span>
              </h1>
              <p className="font-mono text-[10px] tracking-widest text-text-dim">
                {league.data ? league.data.name.toUpperCase() : "CONNECTING TO LEAGUE..."}
              </p>
            </div>
          </div>

          <div className="hidden text-right sm:block">
            <div className="font-mono text-[10px] tracking-widest text-text-dim">
              {nflState.data ? `${nflState.data.season} · WEEK ${nflState.data.week}` : "SYNCING..."}
            </div>
            <div className="font-mono text-xs font-bold tabular-nums text-red-glow">
              {now.toLocaleTimeString("en-US", { hour12: false })}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
