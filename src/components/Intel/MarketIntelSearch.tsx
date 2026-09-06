import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Newspaper, Search, ExternalLink, KeyRound } from "lucide-react";
import { Panel } from "../UI/Panel";
import { LoadingState, ErrorState } from "../UI/LoadingState";
import { useSettings } from "../../context/SettingsContext";
import { tavilySearch, type TavilyResponse } from "../../services/intel";

const PRESETS: { label: string; query: string }[] = [
  {
    label: "ADP Movers",
    query: "fantasy football ADP risers and fallers this week consensus rankings FantasyPros Underdog",
  },
  {
    label: "Injury Report",
    query: "NFL injury report this week fantasy football questionable doubtful out designations",
  },
  {
    label: "Vegas & Weather",
    query: "NFL week Vegas odds over/under implied team totals weather forecast fantasy football impact",
  },
];

export function MarketIntelSearch() {
  const { tavilyKey, hasTavilyKey } = useSettings();
  const [customQuery, setCustomQuery] = useState("");

  const mutation = useMutation<TavilyResponse, Error, string>({
    mutationFn: (query: string) => tavilySearch(query, tavilyKey),
  });

  const runPreset = (query: string) => mutation.mutate(query);

  const runCustom = () => {
    if (customQuery.trim()) mutation.mutate(customQuery.trim());
  };

  return (
    <Panel
      title="Market Intel Search"
      icon={Newspaper}
      accent="red"
      right={
        !hasTavilyKey && (
          <span className="flex items-center gap-1 font-mono text-[10px] text-warn">
            <KeyRound size={11} /> NO API KEY
          </span>
        )
      }
    >
      {!hasTavilyKey ? (
        <p className="font-mono text-xs text-text-dim">
          Add a Tavily API key in Skynet Console settings to enable live ADP, injury, and Vegas-line search. Sleeper's
          own trending and injury-status data above works without any key.
        </p>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => runPreset(p.query)}
                disabled={mutation.isPending}
                className="border border-line-bright bg-panel-raised px-2.5 py-1 font-mono text-[11px] tracking-wide text-text-primary transition hover:border-red-glow hover:text-red-glow disabled:opacity-40"
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="mb-3 flex gap-2">
            <input
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runCustom()}
              placeholder="e.g. Puka Nacua injury status week 2"
              className="flex-1 border border-line bg-panel px-3 py-1.5 font-mono text-xs text-text-primary placeholder:text-text-faint focus:border-red-glow focus:outline-none"
            />
            <button
              onClick={runCustom}
              disabled={mutation.isPending || !customQuery.trim()}
              className="flex items-center gap-1.5 border border-red-dim bg-red-deep/30 px-3 py-1.5 font-mono text-[11px] font-bold text-red-glow hover:bg-red-deep/50 disabled:opacity-40"
            >
              <Search size={13} />
              SEARCH
            </button>
          </div>

          {mutation.isPending && <LoadingState label="QUERYING MARKET INTEL NETWORK..." />}
          {mutation.isError && <ErrorState message={mutation.error.message} />}

          {mutation.isSuccess && (
            <div className="space-y-3">
              {mutation.data.answer && (
                <div className="border border-line-bright bg-panel-raised p-3">
                  <div className="mb-1 font-mono text-[10px] font-bold tracking-widest text-red-glow">SUMMARY</div>
                  <p className="text-xs leading-relaxed text-text-primary">{mutation.data.answer}</p>
                </div>
              )}
              {mutation.data.results.map((r) => (
                <a
                  key={r.url}
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block border-b border-line/50 py-2 last:border-b-0 hover:bg-panel-raised"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
                    <span className="truncate">{r.title}</span>
                    <ExternalLink size={11} className="shrink-0 text-text-faint" />
                  </div>
                  <p className="mt-0.5 line-clamp-2 font-mono text-[11px] text-text-dim">{r.content}</p>
                </a>
              ))}
            </div>
          )}
        </>
      )}
    </Panel>
  );
}
