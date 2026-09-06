import { useState } from "react";
import { Check, ClipboardCopy, Trash2, Send } from "lucide-react";
import { Panel } from "../UI/Panel";
import { useCommish } from "../../context/CommishContext";
import { copyToClipboard } from "../../lib/clipboard";

export function CommishExport() {
  const { actionsText, setActionsText } = useCommish();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copyToClipboard(actionsText);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <Panel
      title="Commish Action Export"
      icon={Send}
      accent="red"
      right={
        <span className="font-mono text-[10px] text-text-faint">
          {actionsText.trim() ? `${actionsText.trim().split("\n").length} LINE(S)` : "EMPTY"}
        </span>
      }
    >
      <textarea
        value={actionsText}
        onChange={(e) => setActionsText(e.target.value)}
        placeholder={
          'Commish Action Needed:\n- Move Christian McCaffrey to IR\n- Start Player B over Player C (FLEX)\n\nSend results from the Skynet Console (Lineup Optimizer / Waiver mode) here, or type moves manually.'
        }
        rows={6}
        className="w-full resize-y border border-line bg-panel px-3 py-2 font-mono text-xs text-text-primary placeholder:text-text-faint focus:border-red-glow focus:outline-none"
      />
      <div className="mt-2 flex gap-2">
        <button
          onClick={handleCopy}
          disabled={!actionsText.trim()}
          className="flex items-center gap-1.5 border border-red-dim bg-red-deep/30 px-3 py-1.5 font-mono text-[11px] font-bold tracking-wider text-red-glow transition hover:bg-red-deep/50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {copied ? <Check size={13} /> : <ClipboardCopy size={13} />}
          {copied ? "COPIED" : "COPY ROSTER MOVES"}
        </button>
        <button
          onClick={() => setActionsText("")}
          disabled={!actionsText.trim()}
          className="flex items-center gap-1.5 border border-line-bright px-3 py-1.5 font-mono text-[11px] tracking-wider text-text-dim transition hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Trash2 size={13} />
          CLEAR
        </button>
      </div>
    </Panel>
  );
}
