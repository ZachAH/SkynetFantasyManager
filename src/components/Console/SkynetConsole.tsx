import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Terminal, Settings, Send, Loader2, AlertTriangle, Search } from "lucide-react";
import clsx from "clsx";
import { Panel } from "../UI/Panel";
import { SettingsModal } from "./SettingsModal";
import { useSettings } from "../../context/SettingsContext";
import { useCommish } from "../../context/CommishContext";
import {
  useLeague,
  useLeagueRosters,
  useLeagueUsers,
  useAllPlayers,
  useSkynetGM,
  useTrendingAdds,
  useWeeklyProjections,
} from "../../hooks/useSleeperLeague";
import { useSkynetMatchup } from "../../hooks/useSkynetMatchup";
import { useCurrentDraft } from "../../hooks/useLeagueDraft";
import {
  buildAllRostersSummary,
  buildDraftContextSummary,
  buildLeagueContextSummary,
  buildWebSearchContext,
  type WebSearchLabels,
} from "../../lib/leagueContext";
import { computeDraftTurn } from "../../lib/draftTurn";
import { resolveEffectiveLeague } from "../../lib/resolveLeagueSettings";
import { MODE_INSTRUCTIONS, SKYNET_SYSTEM_PROMPT, buildModePrompt, type SkynetMode } from "../../lib/skynetPrompts";
import { chatComplete } from "../../services/llm";
import { tavilySearch, IntelError } from "../../services/intel";

const MODES: { value: SkynetMode; label: string }[] = [
  { value: "draft", label: "Draft Assistant" },
  { value: "lineup", label: "Lineup Optimizer" },
  { value: "waiver", label: "Waiver / FAAB" },
  { value: "trade", label: "Trade Desk" },
  { value: "trashtalk", label: "Trash Talk" },
  { value: "freeform", label: "Operator Query" },
];

/** Modes that benefit from a live Tavily web search beyond training knowledge. */
const WEB_SEARCH_CONFIG: Partial<Record<SkynetMode, { query: (week: number | undefined) => string } & WebSearchLabels>> = {
  draft: {
    query: () => "2026 fantasy football draft rankings ADP consensus top 200 overall PPR redraft",
    label: "LIVE ADP WEB SEARCH",
    primaryUseNote:
      "this is more current than your training knowledge and should be your PRIMARY source for who's actually good/available right now; cross-reference every name against the DRAFT STATUS block above and never recommend someone already drafted.",
    noKeyNote: "relying on your own training knowledge for player evaluation. Flag this limitation and be conservative about recency (rookies, offseason trades, camp battles may be wrong).",
  },
  lineup: {
    query: (week) => `NFL week ${week ?? ""} 2026 injury report questionable doubtful game status update fantasy football`,
    label: "LIVE INJURY/NEWS WEB SEARCH",
    primaryUseNote: "use it as your most current source on any questionable/doubtful player's real game-time status; PROJ figures in the context block are your primary source for point comparisons.",
    noKeyNote: "relying on your own training knowledge and the injury tags already in the context block. Flag this limitation for any player without a clear designation.",
  },
  waiver: {
    query: (week) => `fantasy football waiver wire pickups week ${week ?? ""} 2026 breakout streamers add`,
    label: "LIVE WAIVER WIRE WEB SEARCH",
    primaryUseNote: "cross-reference it against the trending-add list and PROJ figures for the freshest opportunity signal (new starting role, injury ahead of someone, etc.).",
    noKeyNote: "relying on the trending-add list, PROJ figures, and your own training knowledge for waiver value.",
  },
  trade: {
    query: () => "2026 fantasy football rest of season trade value chart buy low sell high",
    label: "LIVE TRADE VALUE WEB SEARCH",
    primaryUseNote: "use it to sanity-check rest-of-season value perception, but the ALL LEAGUE ROSTERS block's PROJ figures and positional need are still your primary quantitative basis.",
    noKeyNote: "relying on your own training knowledge and the PROJ figures/positional needs already in the context block for trade value.",
  },
};

interface Props {
  /** Bump this (e.g. ++) to force-switch to Draft Assistant mode, even if this tab is already mounted. */
  forceDraftModeSignal?: number;
}

export function SkynetConsole({ forceDraftModeSignal }: Props) {
  const settings = useSettings();
  const commish = useCommish();
  const [mode, setMode] = useState<SkynetMode>("lineup");
  const [freeformInput, setFreeformInput] = useState("");
  const [tradeInput, setTradeInput] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [stage, setStage] = useState<"searching" | "reasoning" | null>(null);

  useEffect(() => {
    if (forceDraftModeSignal) setMode("draft");
  }, [forceDraftModeSignal]);

  const league = useLeague();
  const users = useLeagueUsers();
  const rosters = useLeagueRosters();
  const players = useAllPlayers();
  const skynet = useSkynetGM();
  const matchup = useSkynetMatchup();
  const trending = useTrendingAdds(20);
  const draft = useCurrentDraft();

  const effectiveLeague = useMemo(() => (league.data ? resolveEffectiveLeague(league.data) : undefined), [league.data]);

  const needsProjections = mode === "lineup" || mode === "waiver" || mode === "trade";
  const projections = useWeeklyProjections(
    effectiveLeague?.season,
    matchup.week,
    effectiveLeague?.scoring_settings,
    needsProjections,
  );

  const dataReady = Boolean(league.data && users.data && rosters.data);

  const runMutation = useMutation({
    mutationFn: async () => {
      const contextBlock = buildLeagueContextSummary({
        league: effectiveLeague,
        users: users.data,
        rosters: rosters.data,
        players: players.data,
        skynetRoster: skynet.roster,
        skynetUser: skynet.user,
        currentWeek: matchup.week,
        myMatchup: matchup.myMatchup,
        opponentMatchup: matchup.opponentMatchup,
        opponentRoster: matchup.opponentRoster,
        opponentUser: matchup.opponentUser,
        trendingAdds: trending.data,
        projections: needsProjections ? projections.data : undefined,
      });

      const draftBlock =
        mode === "draft"
          ? buildDraftContextSummary({
              draft: draft.draft,
              picks: draft.picks,
              players: players.data,
              users: users.data,
              rosterPositions: effectiveLeague?.roster_positions ?? [],
              skynetRosterId: skynet.roster?.roster_id,
              turn: computeDraftTurn(draft.draft, draft.picks, skynet.user?.user_id),
            })
          : "";

      const allRostersBlock =
        mode === "trade"
          ? buildAllRostersSummary(rosters.data, users.data, players.data, skynet.roster?.roster_id, projections.data)
          : "";

      const tradeProposalBlock =
        mode === "trade" && tradeInput.trim().length > 0 ? `OPERATOR TRADE PROPOSAL: ${tradeInput.trim()}` : "";

      let webSearchBlock = "";
      const webSearchCfg = WEB_SEARCH_CONFIG[mode];
      if (webSearchCfg) {
        if (settings.hasTavilyKey) {
          setStage("searching");
          try {
            const search = await tavilySearch(webSearchCfg.query(matchup.week), settings.tavilyKey, {
              maxResults: 8,
              days: mode === "draft" ? 45 : 7,
            });
            webSearchBlock = buildWebSearchContext(search, webSearchCfg);
          } catch (err) {
            const msg = err instanceof IntelError || err instanceof Error ? err.message : "unknown error";
            webSearchBlock = buildWebSearchContext(undefined, webSearchCfg, msg);
          }
        } else {
          webSearchBlock = buildWebSearchContext(undefined, webSearchCfg);
        }
      }

      setStage("reasoning");

      const extra =
        mode === "freeform"
          ? `${MODE_INSTRUCTIONS.freeform}\n\nOPERATOR QUESTION: ${freeformInput.trim()}`
          : MODE_INSTRUCTIONS[mode];

      const fullContext = [contextBlock, draftBlock, allRostersBlock, tradeProposalBlock, webSearchBlock]
        .filter(Boolean)
        .join("\n\n");
      const userPrompt = buildModePrompt(fullContext, extra);

      try {
        return await chatComplete({
          provider: settings.llmProvider,
          apiKey: settings.activeLlmKey,
          systemPrompt: SKYNET_SYSTEM_PROMPT,
          userPrompt,
        });
      } finally {
        setStage(null);
      }
    },
  });

  const canRun = dataReady && settings.hasActiveLlmKey && (mode !== "freeform" || freeformInput.trim().length > 0);

  return (
    <div className="space-y-4">
      <Panel
        title="Skynet AI Console"
        icon={Terminal}
        accent="red"
        right={
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-1 font-mono text-[10px] tracking-wider text-text-dim hover:text-red-glow"
          >
            <Settings size={13} />
            CONFIG
          </button>
        }
      >
        <div className="mb-3 flex flex-wrap gap-1.5">
          {MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => setMode(m.value)}
              className={clsx(
                "border px-2.5 py-1 font-mono text-[11px] font-bold tracking-wide transition",
                mode === m.value
                  ? "border-red-glow bg-red-deep/30 text-red-glow"
                  : "border-line-bright text-text-dim hover:text-text-primary",
              )}
            >
              {m.label.toUpperCase()}
            </button>
          ))}
        </div>

        {mode === "freeform" && (
          <textarea
            value={freeformInput}
            onChange={(e) => setFreeformInput(e.target.value)}
            placeholder="Ask Skynet anything about the league, roster, or matchup..."
            rows={2}
            className="mb-3 w-full resize-none border border-line bg-panel px-3 py-2 font-mono text-xs text-text-primary placeholder:text-text-faint focus:border-red-glow focus:outline-none"
          />
        )}

        {mode === "trade" && (
          <textarea
            value={tradeInput}
            onChange={(e) => setTradeInput(e.target.value)}
            placeholder="Optional: describe a specific trade to evaluate, e.g. 'my bench RB Player A for their bench WR Player B'. Leave blank for Skynet to scan the league and propose one."
            rows={2}
            className="mb-3 w-full resize-none border border-line bg-panel px-3 py-2 font-mono text-xs text-text-primary placeholder:text-text-faint focus:border-red-glow focus:outline-none"
          />
        )}

        {!settings.hasActiveLlmKey && (
          <div className="mb-3 flex items-center gap-2 border border-warn/40 bg-warn/5 px-3 py-2 font-mono text-[11px] text-warn">
            <AlertTriangle size={13} />
            No {settings.llmProvider} API key configured. Click CONFIG to add one.
          </div>
        )}

        {WEB_SEARCH_CONFIG[mode] && !settings.hasTavilyKey && (
          <div className="mb-3 flex items-center gap-2 border border-warn/40 bg-warn/5 px-3 py-2 font-mono text-[11px] text-warn">
            <Search size={13} />
            No Tavily key — {mode} will use the model's own training knowledge instead of a live web search. Add one
            in CONFIG for current data.
          </div>
        )}

        <button
          onClick={() => runMutation.mutate()}
          disabled={!canRun || runMutation.isPending}
          className="flex items-center gap-1.5 border border-red-dim bg-red-deep/30 px-4 py-2 font-mono text-xs font-bold tracking-widest text-red-glow transition hover:bg-red-deep/50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {runMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          {stage === "searching" ? "SEARCHING LIVE WEB..." : stage === "reasoning" ? "COMPUTING..." : "EXECUTE"}
        </button>

        {runMutation.isError && (
          <div className="mt-3 border border-crit/40 bg-red-deep/20 px-3 py-2 font-mono text-xs text-crit">
            {runMutation.error instanceof Error ? runMutation.error.message : "Unknown error."}
          </div>
        )}

        {runMutation.isSuccess && (
          <div className="mt-4">
            <div className="border border-line-bright bg-panel-raised p-3">
              <div className="mb-2 flex items-center gap-1.5 font-mono text-[10px] font-bold tracking-widest text-red-glow">
                <Terminal size={11} />
                SKYNET://OUTPUT
              </div>
              <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-text-primary">
                {runMutation.data}
              </pre>
            </div>
            {(mode === "lineup" || mode === "waiver" || mode === "trade") && (
              <button
                onClick={() => commish.setActionsText(runMutation.data)}
                className="mt-2 border border-line-bright px-3 py-1.5 font-mono text-[11px] tracking-wide text-text-dim transition hover:border-red-glow hover:text-red-glow"
              >
                SEND TO COMMISH EXPORT →
              </button>
            )}
          </div>
        )}
      </Panel>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
