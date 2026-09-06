import type { LucideIcon } from "lucide-react";
import clsx from "clsx";

export interface TabDef {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface Props {
  tabs: TabDef[];
  active: string;
  onChange: (id: string) => void;
}

export function TabNav({ tabs, active, onChange }: Props) {
  return (
    <nav className="border-b border-line-bright bg-panel">
      <div className="mx-auto flex max-w-7xl gap-1 px-4 sm:px-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={clsx(
                "flex items-center gap-1.5 border-b-2 px-3 py-2.5 font-mono text-xs font-bold tracking-wider transition sm:px-4",
                isActive
                  ? "border-red-glow text-red-glow"
                  : "border-transparent text-text-dim hover:text-text-primary",
              )}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{tab.label.toUpperCase()}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
