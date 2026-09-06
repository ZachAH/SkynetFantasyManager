import { createContext, useContext, useState, type ReactNode } from "react";

interface CommishContextValue {
  actionsText: string;
  setActionsText: (text: string) => void;
}

const CommishContext = createContext<CommishContextValue | null>(null);

export function CommishProvider({ children }: { children: ReactNode }) {
  const [actionsText, setActionsText] = useState("");
  return <CommishContext.Provider value={{ actionsText, setActionsText }}>{children}</CommishContext.Provider>;
}

export function useCommish(): CommishContextValue {
  const ctx = useContext(CommishContext);
  if (!ctx) throw new Error("useCommish must be used within CommishProvider");
  return ctx;
}
