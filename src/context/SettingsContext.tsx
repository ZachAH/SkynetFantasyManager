import { createContext, useContext, useMemo, type ReactNode } from "react";
import { LS_KEYS } from "../config/constants";
import { useLocalStorageState } from "../lib/useLocalStorageState";

export type LlmProvider = "openai" | "anthropic" | "gemini";

interface SettingsContextValue {
  llmProvider: LlmProvider;
  setLlmProvider: (p: LlmProvider) => void;
  openaiKey: string;
  setOpenaiKey: (v: string) => void;
  anthropicKey: string;
  setAnthropicKey: (v: string) => void;
  geminiKey: string;
  setGeminiKey: (v: string) => void;
  tavilyKey: string;
  setTavilyKey: (v: string) => void;
  activeLlmKey: string;
  hasActiveLlmKey: boolean;
  hasTavilyKey: boolean;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [llmProviderRaw, setLlmProviderRaw] = useLocalStorageState(LS_KEYS.llmProvider, "openai");
  const [openaiKey, setOpenaiKey] = useLocalStorageState(LS_KEYS.openaiKey);
  const [anthropicKey, setAnthropicKey] = useLocalStorageState(LS_KEYS.anthropicKey);
  const [geminiKey, setGeminiKey] = useLocalStorageState(LS_KEYS.geminiKey);
  const [tavilyKey, setTavilyKey] = useLocalStorageState(LS_KEYS.tavilyKey);

  const llmProvider = (llmProviderRaw as LlmProvider) || "openai";

  const activeLlmKey = useMemo(() => {
    if (llmProvider === "openai") return openaiKey;
    if (llmProvider === "anthropic") return anthropicKey;
    return geminiKey;
  }, [llmProvider, openaiKey, anthropicKey, geminiKey]);

  const value: SettingsContextValue = {
    llmProvider,
    setLlmProvider: (p) => setLlmProviderRaw(p),
    openaiKey,
    setOpenaiKey,
    anthropicKey,
    setAnthropicKey,
    geminiKey,
    setGeminiKey,
    tavilyKey,
    setTavilyKey,
    activeLlmKey,
    hasActiveLlmKey: activeLlmKey.trim().length > 0,
    hasTavilyKey: tavilyKey.trim().length > 0,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
