import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import clsx from "clsx";

interface PanelProps {
  title?: string;
  icon?: LucideIcon;
  accent?: "red" | "green" | "amber" | "none";
  children: ReactNode;
  className?: string;
  right?: ReactNode;
}

const ACCENT_TEXT: Record<NonNullable<PanelProps["accent"]>, string> = {
  red: "text-red-glow",
  green: "text-good",
  amber: "text-warn",
  none: "text-text-dim",
};

export function Panel({ title, icon: Icon, accent = "red", children, className, right }: PanelProps) {
  return (
    <div className={clsx("hud-panel clip-corner", className)}>
      {title && (
        <div className="relative flex items-center justify-between border-b border-line px-4 py-2.5">
          <div className="flex items-center gap-2">
            {Icon && <Icon size={14} className={ACCENT_TEXT[accent]} strokeWidth={2.5} />}
            <h2 className="font-display text-[11px] font-bold tracking-[0.2em] text-text-primary uppercase">
              {title}
            </h2>
          </div>
          {right}
        </div>
      )}
      <div className="relative p-4">{children}</div>
    </div>
  );
}
