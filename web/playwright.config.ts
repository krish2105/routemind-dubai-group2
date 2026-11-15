import { defineConfig } from "@playwright/test";

/**
 * Playwright (owner: Krishna). Uses the installed Google Chrome (no browser download).
 *   npm run e2e                                     -> builds nothing; starts `next start` on :3210 and runs the smoke test
 *   BASE_URL=https://<vercel-url> npm run e2e       -> runs against the live site instead
 *   SHOTS=1 BASE_URL=... npx playwright test capture -> screenshots + demo video into ../deliverables (Monday 18:30)
 * Run `npm run build` first when testing locally.
 */
const external = process.env.BASE_URL;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 120_000,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: external ?? "http://localhost:3210",
    channel: process.env.PW_CHANNEL ?? "chrome",
    viewport: { width: 1440, height: 900 },
    colorScheme: "light",
  },
  webServer: external ? undefined : { command: "npx next start -p 3210", url: "http://localhost:3210", reuseExistingServer: true, timeout: 60_000 },
});
