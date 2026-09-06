/**
 * Build-time default API keys, sourced from Vite env vars (.env locally,
 * Netlify's Environment Variables UI in production).
 *
 * SECURITY NOTE: this is a static client-only app. Vite inlines every
 * `VITE_`-prefixed var directly into the shipped JS bundle at build time —
 * these are NOT server-side secrets. Anyone who opens dev tools on the
 * deployed site can read them in plain text. They're provided here only as
 * a convenience default; a value the user types into Settings (stored in
 * their own browser's localStorage) always takes precedence. See README.
 */
export const ENV_DEFAULT_KEYS = {
  openai: import.meta.env.VITE_OPENAI_API_KEY ?? "",
  anthropic: import.meta.env.VITE_ANTHROPIC_API_KEY ?? "",
  gemini: import.meta.env.VITE_GEMINI_API_KEY ?? "",
  tavily: import.meta.env.VITE_TAVILY_API_KEY ?? "",
} as const;
