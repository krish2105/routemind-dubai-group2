# web/ (Next.js app, Vercel root)

The RouteMind Dubai prototype: Next.js 16 App Router, TypeScript (strict), Tailwind v4, MapLibre + deck.gl, Recharts, React Three Fiber, Zustand, Comlink Web Workers. Live at https://web-rws7.vercel.app. See the [root README](../README.md) for the full overview.

```bash
npm ci
npm run dev                    # http://localhost:3000
npm run check                  # typecheck + unit tests + production build
npm run build && npm run e2e   # Playwright smoke tests (installed Google Chrome)
npm run freeze -- --dry-run    # recompute the headline numbers without saving
npx tsx scripts/crosscheck.ts  # confirm slide/script numbers match docs/frozen_results.json
```

| Folder | Contents |
|---|---|
| `app/` | 11 pages + `api/copilot` |
| `lib/engine/` | Problem builder, shared evaluator, baseline, Clarke-Wright + local search, GA, k-means, re-routing, KPIs |
| `lib/models/` | Browser ETA model (tree evaluation) |
| `workers/`, `store/` | Web Worker solver and the Zustand store that talks to it |
| `components/` | Map, charts, ROI, re-routing, UI design system, theme toggle |
| `public/data/` | Assumptions, frozen results, ETA model and metrics, RL results |
| `tests/` | Vitest unit tests and Playwright e2e (`tests/e2e/`) |

Optional: set `LLM_API_KEY` in `.env.local` for live copilot text; without it the copilot uses validated templates.

Deploy: Vercel project with **Root Directory = `web`**; every merge to `main` deploys automatically.
