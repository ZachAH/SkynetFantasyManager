export interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
  published_date?: string;
}

export interface TavilyResponse {
  answer: string | null;
  results: TavilyResult[];
}

export class IntelError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IntelError";
  }
}

export async function tavilySearch(
  query: string,
  apiKey: string,
  opts: { maxResults?: number; days?: number } = {},
): Promise<TavilyResponse> {
  if (!apiKey.trim()) {
    throw new IntelError("No Tavily API key configured. Add one in Skynet Console settings to enable live market intel.");
  }

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "advanced",
      include_answer: true,
      max_results: opts.maxResults ?? 6,
      days: opts.days ?? 3,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new IntelError(`Tavily ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  return {
    answer: data.answer ?? null,
    results: (data.results ?? []) as TavilyResult[],
  };
}
