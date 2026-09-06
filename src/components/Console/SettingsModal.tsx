import { X, KeyRound } from "lucide-react";
import { useSettings, type LlmProvider } from "../../context/SettingsContext";

interface Props {
  open: boolean;
  onClose: () => void;
}

const PROVIDERS: { value: LlmProvider; label: string }[] = [
  { value: "openai", label: "OpenAI (GPT)" },
  { value: "anthropic", label: "Anthropic (Claude)" },
  { value: "gemini", label: "Google (Gemini)" },
];

export function SettingsModal({ open, onClose }: Props) {
  const s = useSettings();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="hud-panel clip-corner w-full max-w-md border-glow"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex items-center justify-between border-b border-line px-4 py-3">
          <div className="flex items-center gap-2">
            <KeyRound size={14} className="text-red-glow" />
            <h2 className="font-display text-xs font-bold tracking-[0.2em] text-text-primary">SKYNET CONFIG</h2>
          </div>
          <button onClick={onClose} className="text-text-dim hover:text-text-primary">
            <X size={16} />
          </button>
        </div>

        <div className="relative space-y-4 p-4">
          <div>
            <label className="mb-1 block font-mono text-[10px] font-bold tracking-widest text-text-dim">
              LLM PROVIDER
            </label>
            <select
              value={s.llmProvider}
              onChange={(e) => s.setLlmProvider(e.target.value as LlmProvider)}
              className="w-full border border-line bg-panel px-2 py-1.5 font-mono text-xs text-text-primary focus:border-red-glow focus:outline-none"
            >
              {PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <ApiKeyField label="OpenAI API Key" value={s.openaiKey} onChange={s.setOpenaiKey} placeholder="sk-..." />
          <ApiKeyField label="Anthropic API Key" value={s.anthropicKey} onChange={s.setAnthropicKey} placeholder="sk-ant-..." />
          <ApiKeyField label="Gemini API Key" value={s.geminiKey} onChange={s.setGeminiKey} placeholder="AIza..." />
          <div className="border-t border-line pt-3">
            <ApiKeyField
              label="Tavily API Key (Market Intel Search)"
              value={s.tavilyKey}
              onChange={s.setTavilyKey}
              placeholder="tvly-..."
            />
          </div>

          <p className="font-mono text-[10px] leading-relaxed text-text-faint">
            Keys are stored only in this browser's localStorage and sent directly from your browser to the provider's
            API. Nothing passes through a Skynet server. Clear them anytime by emptying the field.
          </p>
        </div>
      </div>
    </div>
  );
}

function ApiKeyField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-1 block font-mono text-[10px] font-bold tracking-widest text-text-dim">{label}</label>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full border border-line bg-panel px-2 py-1.5 font-mono text-xs text-text-primary placeholder:text-text-faint focus:border-red-glow focus:outline-none"
      />
    </div>
  );
}
