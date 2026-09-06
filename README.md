# Skynet Fantasy GM

An autonomous AI Fantasy Football General Manager dashboard for the Sleeper league **THE FAMILY** (`1399902393012912128`), managing the `Skynet089197` franchise. Dark cyberpunk / Cyberdyne HUD aesthetic, built with React + Vite + TypeScript + Tailwind CSS v4.

## Quick start

```bash
npm install
npm run dev
```

Everything works out of the box against the live, free, read-only Sleeper API — no keys required for the War Room dashboard or the Market Intel trending/injury feeds.

## Optional: enable the Skynet AI Console + live web search

The AI Console and the Tavily-powered Market Intel search need API keys. There are two ways to provide them:

1. **Type one into the app** — open **Skynet Console → CONFIG** and paste it in. Stored only in your browser's `localStorage`, sent directly from your browser to that provider's API.
2. **Bake one into the build via env vars** — copy `.env.example` to `.env` and fill in values (see **⚠️ Security** below before doing this for a deployed site).

| Key | Env var | Used for | Get one at |
|---|---|---|---|
| OpenAI API key | `VITE_OPENAI_API_KEY` | LLM reasoning | platform.openai.com |
| Anthropic API key | `VITE_ANTHROPIC_API_KEY` | LLM reasoning (Claude) | console.anthropic.com |
| Gemini API key | `VITE_GEMINI_API_KEY` | LLM reasoning (Google) | **aistudio.google.com/app/apikey** — not the generic Cloud Console API key page; that issues a different key format (`AQ...`) that the public Gemini API rejects. Default provider is Gemini when this is set. |
| Tavily API key | `VITE_TAVILY_API_KEY` | Live ADP / injury / Vegas-line web search | tavily.com |

A key typed into Settings always overrides an env-baked one for that browser. A field populated from an env var is labeled `[DEPLOYMENT DEFAULT]` in the Settings modal.

This is a static client-only app with no backend, so nothing passes through a Skynet server — which also means:

- Anthropic calls include the `anthropic-dangerous-direct-browser-access` header, which is what makes direct browser calls possible; if a provider ever tightens CORS, the fix is to add a thin serverless proxy (e.g. a single Netlify/Vercel function) that forwards the request — the console surfaces a clear error if a call is blocked.
- Don't paste keys into this app on a shared/public machine.

### ⚠️ Security: env vars in a static build are public

Vite inlines every `VITE_`-prefixed env var directly into the JavaScript bundle at build time. Setting one in Netlify's **Site configuration → Environment variables** does **not** keep it server-side the way it would for a backend app — it ends up in plain text in the shipped JS, readable by anyone who opens dev tools on your deployed site. Treat any key you put here as public: use a key you're comfortable with a stranger using on your bill, and never put a key with broader account access (e.g. one also scoped to billing or other APIs) in `.env`. If you want a genuinely private key, the fix is a serverless function proxy instead of a build-time env var — ask if you want that wired up.

`.env` is gitignored — never commit real key values.

## Architecture

```
src/
  services/sleeper.ts     Sleeper API client (league, users, rosters, matchups, players, trending, drafts)
  services/llm.ts          Provider-agnostic chat completion (OpenAI / Anthropic / Gemini)
  services/intel.ts        Tavily search wrapper for market intel
  hooks/useSleeperLeague.ts   TanStack Query hooks + Skynet roster/user resolution
  hooks/useSkynetMatchup.ts   Current-week matchup + opponent resolution
  hooks/useLeagueDraft.ts     Draft + picks resolution (live during draft night)
  lib/leagueContext.ts     Assembles a compact league/roster summary fed to the LLM
  lib/skynetPrompts.ts     Skynet's persona system prompt + per-mode instructions
  lib/scoringMatrix.ts     Parses scoring_settings into a labeled, grouped matrix
  lib/rosterSlots.ts       Parses roster_positions into starters/bench/IR/taxi shape
  lib/winProbability.ts    Heuristic live win-probability estimate
  context/SettingsContext.tsx  API key storage (localStorage-backed)
  context/CommishContext.tsx   Shared text buffer for the Commish Action Export panel
  components/Dashboard/    War Room: roster card, standings, matchup telemetry, scoring matrix, commish export
  components/Intel/        Trending adds/drops, injury watch, Tavily market search
  components/Console/      Skynet AI Console (Draft Assistant / Lineup Optimizer / Waiver+FAAB / Trash Talk / free query)
```

### Why the LLM does the VORP math

This is a static client-only app (no backend), so the "calculate VORP, adjust for our scoring settings" logic is implemented by handing the LLM a grounded, structured context block — actual roster_positions, actual scoring_settings, actual live draft picks, actual trending-add signal — pulled straight from Sleeper, and instructing it (in `skynetPrompts.ts`) to show its arithmetic and never invent players not present in that context. The app's job is building that context correctly and rendering the result; the model's job is the calculation.

### Data freshness

- Rosters/matchups refetch every 30s (live scoring during games).
- League/user metadata every 5min.
- The full NFL player dictionary (~5MB) is cached in `localStorage` for 24h per Sleeper's own guidance, not refetched per session.
- Draft picks poll every 30s only while a draft exists, for real-time draft-night use.

## Notes on the win-probability meter

Sleeper doesn't expose betting-style win odds. The meter in Matchup Telemetry is a heuristic (`lib/winProbability.ts`) blending live score differential with season-long points-per-game — clearly labeled as such in the UI, not a Vegas line.
