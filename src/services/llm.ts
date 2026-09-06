import type { LlmProvider } from "../context/SettingsContext";

export const DEFAULT_MODELS: Record<LlmProvider, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-sonnet-5",
  gemini: "gemini-2.5-flash",
};

export class LlmError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LlmError";
  }
}

interface ChatCompleteParams {
  provider: LlmProvider;
  apiKey: string;
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  temperature?: number;
}

export async function chatComplete({
  provider,
  apiKey,
  systemPrompt,
  userPrompt,
  model,
  temperature = 0.7,
}: ChatCompleteParams): Promise<string> {
  if (!apiKey.trim()) {
    throw new LlmError(`No API key configured for ${provider}. Add one in Skynet Console settings.`);
  }

  const resolvedModel = model?.trim() || DEFAULT_MODELS[provider];

  try {
    if (provider === "openai") return await callOpenAi(apiKey, resolvedModel, systemPrompt, userPrompt, temperature);
    if (provider === "anthropic") return await callAnthropic(apiKey, resolvedModel, systemPrompt, userPrompt, temperature);
    return await callGemini(apiKey, resolvedModel, systemPrompt, userPrompt, temperature);
  } catch (err) {
    if (err instanceof LlmError) throw err;
    const msg = err instanceof Error ? err.message : String(err);
    throw new LlmError(
      `${provider} request failed: ${msg}. If this is a CORS error, the provider may block direct browser calls — a small proxy would be required in production.`,
    );
  }
}

async function callOpenAi(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new LlmError(`OpenAI ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "[Skynet received an empty response]";
}

async function callAnthropic(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1500,
      temperature,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new LlmError(`Anthropic ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data.content?.map((block: { type: string; text?: string }) => block.text ?? "").join("") ?? "";
  return text || "[Skynet received an empty response]";
}

async function callGemini(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: { temperature },
      }),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new LlmError(`Gemini ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
  return text || "[Skynet received an empty response]";
}
