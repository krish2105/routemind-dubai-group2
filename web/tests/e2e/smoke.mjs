#!/usr/bin/env node
/**
 * Route smoke test (QA, Karan's area, built by Yash). No extra dependencies (Playwright is not in package.json;
 * adding it would be a contract change). Fetches every page of the app and checks:
 *   - HTTP 200
 *   - the server-rendered HTML has the page title and the simulated/assumed label
 *   - no Next.js error page markers
 * Browser console errors are checked separately in a real browser (see docs/verification_log.md).
 *
 * Usage:
 *   node tests/e2e/smoke.mjs                          # http://localhost:3000 (npm run dev or npm start first)
 *   BASE_URL=https://<vercel-url> node tests/e2e/smoke.mjs
 * Exit code 0 = all routes pass, 1 = at least one failure.
 */
const BASE = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");

/** route -> text that must appear in the server HTML (case-insensitive) */
const ROUTES = {
  "/": "simulated",
  "/command": "Command Center",
  "/optimizer": "Route Optimizer",
  "/rerouting": "Live Re-routing",
  "/eta": "ETA",
  "/problem": "The Problem &amp; Market",
  "/zones": "Zones &amp; Last Mile",
  "/fleet": "Fleet",
  "/customer": "Customer",
  "/integration": "Integration &amp; Risk",
  "/business-case": "Business Case",
  "/rl-lab": "RL Dispatch Lab",
};
const ERROR_MARKERS = ["Application error", "Internal Server Error", "This page could not be found", "Unhandled Runtime Error"];

let failed = 0;
const t0 = Date.now();
console.log(`Smoke test against ${BASE}`);
for (const [route, must] of Object.entries(ROUTES)) {
  const started = Date.now();
  let status = 0;
  const problems = [];
  try {
    const res = await fetch(BASE + route, { redirect: "follow" });
    status = res.status;
    const html = await res.text();
    if (status !== 200) problems.push(`status ${status}`);
    if (!html.toLowerCase().includes(must.toLowerCase())) problems.push(`missing "${must}"`);
    if (route !== "/" && !/SIMULATED · ASSUMED DATA|SIMULATED &middot; ASSUMED DATA/i.test(html)) problems.push("missing SIMULATED badge");
    for (const m of ERROR_MARKERS) if (html.includes(m)) problems.push(`error marker "${m}"`);
  } catch (e) {
    problems.push(`fetch failed: ${e instanceof Error ? e.message : String(e)}`);
  }
  const ok = problems.length === 0;
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${route.padEnd(15)} ${String(status).padEnd(4)} ${String(Date.now() - started).padStart(5)} ms${ok ? "" : "  " + problems.join("; ")}`);
}
console.log(`${Object.keys(ROUTES).length - failed}/${Object.keys(ROUTES).length} routes passed in ${Date.now() - t0} ms`);
process.exit(failed ? 1 : 0);
