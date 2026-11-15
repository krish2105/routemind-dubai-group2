# web/ (Next.js app, Vercel root)

Working starter: Next.js 16 App Router + TypeScript + Tailwind v4 + Framer Motion + React Three Fiber, shared engine contracts (`lib/types.ts`, `lib/engine/*`), baseline solver, KPI v0, 5 Vitest tests. Algorithm files are **stubs flagged `meta.stub`** until their owners implement them (see `lib/pages.ts` and each member's prompt in `prompts/members/`).

```
cd web
npm install
npm run dev        # http://localhost:3000
npm run check      # typecheck + tests + production build (run before every PR)
npm run freeze -- --dry-run   # Harsh: lock numbers (refuses while stubs remain)
```
Optional: copy `.env.example` to `.env.local` and set `LLM_API_KEY` for live copilot messages. Without it the copilot uses templates.

Deploy: Vercel > import the GitHub repo > **Root Directory = `web`** (Krishna does this once; see `docs/00_TEAM_WORKFLOW.md`).
