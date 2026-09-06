import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Terminal, Settings, Send, Loader2, AlertTriangle } from "lucide-react";
import clsx from "clsx";
import { Panel } from "../UI/Panel";
import { SettingsModal } from "./SettingsModal";
import { useSettings } from "../../context/SettingsContext";
import { useCommish } from "../../context/CommishContext";
import { useLeague, useLeagueRosters, useLeagueUsers, useAllPlayers, useSkynetGM, useTrendingAdds } from "../../hooks/useSleeperLeague";
import { useSkynetMatchup } from "../../hooks/useSkynetMatchup";
import { useCurrentDraft } from "../../hooks/useLeagueDraft";
import { buildDraftContextSummary, buildLeagueContextSummary } from "../../lib/leagueContext";
import { resolveEffectiveLeague } from "../../lib/resolveLeagueSettings";
import { MODE_INSTRUCTIONS, SKYNET_SYSTEM_PROMPT, buildModePrompt, type SkynetMode } from "../../lib/skynetPrompts";
import { chatComplete } from "../../services/llm";

const MODES: { value: SkynetMode; label: string }[] = [
  { value: "draft", label: "Draft Assistant" },
  { value: "lineup", label: "Lineup Optimizer" },
  { value: "waiver", label: "Waiver / FAAB" },
  { value: "trashtalk", label: "Trash Talk" },
  { value: "freeform", label: "Operator Query" },
];

export function SkynetConsole() {
  const settings = useSettings();
  const commish = useCommish();
  const [mode, setMode] = useState<SkynetMode>("lineup");
  const [freeformInput, setFreeformInput] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const league = useLeague();
  const users = useLeagueUsers();
  const rosters = useLeagueRosters();
  const players = useAllPlayers();
  const skynet = useSkynetGM();
  const matchup = useSkynetMatchup();
  const trending = useTrendingAdds(20);
  const draft = useCurrentDraft();

  const dataReady = Boolean(league.data && users.data && rosters.data);

  const runMutation = useMutation({
    mutationFn: async () => {
      const effectiveLeague = league.data ? resolveEffectiveLeague(league.data) : undefined;

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
            })
          : "";

      const extra =
        mode === "freeform"
          ? `${MODE_INSTRUCTIONS.freeform}\n\nOPERATOR QUESTION: ${freeformInput.trim()}`
          : MODE_INSTRUCTIONS[mode];

      const fullContext = draftBlock ? `${contextBlock}\n\n${draftBlock}` : contextBlock;
      const userPrompt = buildModePrompt(fullContext, extra);

      return chatComplete({
        provider: settings.llmProvider,
        apiKey: settings.activeLlmKey,
        systemPrompt: SKYNET_SYSTEM_PROMPT,
        userPrompt,
      });
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

        {!settings.hasActiveLlmKey && (
          <div className="mb-3 flex items-center gap-2 border border-warn/40 bg-warn/5 px-3 py-2 font-mono text-[11px] text-warn">
            <AlertTriangle size={13} />
            No {settings.llmProvider} API key configured. Click CONFIG to add one.
          </div>
        )}

        <button
          onClick={() => runMutation.mutate()}
          disabled={!canRun || runMutation.isPending}
          className="flex items-center gap-1.5 border border-red-dim bg-red-deep/30 px-4 py-2 font-mono text-xs font-bold tracking-widest text-red-glow transition hover:bg-red-deep/50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {runMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          {runMutation.isPending ? "COMPUTING..." : "EXECUTE"}
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
            {(mode === "lineup" || mode === "waiver") && (
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
