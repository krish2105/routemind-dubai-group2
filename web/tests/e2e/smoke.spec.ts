import { expect, test, type Page } from "@playwright/test";

/**
 * Route smoke test (QA: Karan's area, built by Yash). Every page of the app loads, shows its title and the
 * SIMULATED badge, and logs no console error or uncaught page error.
 *   npx playwright test smoke                         -> local `next start` on :3210 (run `npm run build` first)
 *   BASE_URL=https://<vercel-url> npx playwright test smoke   -> the live site
 */
function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(String(e)));
  return errors;
}

const ROUTES: { path: string; title: string }[] = [
  { path: "/command", title: "Command Center" },
  { path: "/optimizer", title: "Route Optimizer" },
  { path: "/rerouting", title: "Live Re-routing" },
  { path: "/eta", title: "ETA & Delay Model" },
  { path: "/problem", title: "The Problem & Market" },
  { path: "/zones", title: "Zones & Last Mile" },
  { path: "/fleet", title: "Fleet & Sustainability" },
  { path: "/customer", title: "Customer & SLA" },
  { path: "/integration", title: "Integration & Risk" },
  { path: "/business-case", title: "Business Case & Pilot" },
  { path: "/rl-lab", title: "RL Dispatch Lab" },
];

test("landing page loads without console errors", async ({ page }) => {
  const errors = watchErrors(page);
  const res = await page.goto("/");
  expect(res?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("RouteMind");
  await page.waitForTimeout(1000);
  expect(errors).toEqual([]);
});

for (const r of ROUTES) {
  test(`${r.path} loads with title, SIMULATED badge and no console errors`, async ({ page }) => {
    const errors = watchErrors(page);
    const res = await page.goto(r.path);
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1, name: r.title })).toBeVisible();
    await expect(page.getByText("SIMULATED · ASSUMED DATA").first()).toBeVisible();
    await page.waitForTimeout(2500); // let workers, maps and charts start
    expect(errors).toEqual([]);
  });
}

test("an unknown route returns 404", async ({ page }) => {
  const res = await page.goto("/does-not-exist");
  expect(res?.status()).toBe(404);
});
