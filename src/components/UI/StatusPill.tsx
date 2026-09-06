import clsx from "clsx";

const TONE_CLASSES = {
  crit: "border-crit/50 bg-crit/10 text-crit",
  warn: "border-warn/50 bg-warn/10 text-warn",
  good: "border-good/50 bg-good/10 text-good",
  none: "border-line-bright bg-panel-raised text-text-dim",
} as const;

export function StatusPill({ label, tone = "none" }: { label: string; tone?: keyof typeof TONE_CLASSES }) {
  if (!label) return null;
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wide",
        TONE_CLASSES[tone],
      )}
    >
      {label}
    </span>
  );
}
