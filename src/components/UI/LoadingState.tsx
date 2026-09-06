import { Loader2 } from "lucide-react";

export function LoadingState({ label = "SYNCING WITH SLEEPER NETWORK..." }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 py-6 text-xs text-text-dim">
      <Loader2 size={14} className="animate-spin text-red-glow" />
      <span className="font-mono tracking-wider">{label}</span>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 border border-crit/40 bg-red-deep/20 px-3 py-2.5 text-xs text-crit">
      <span className="font-display font-bold">[ERR]</span>
      <span className="font-mono">{message}</span>
    </div>
  );
}
