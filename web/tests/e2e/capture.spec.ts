import fs from "node:fs";
import path from "node:path";
import { test, type Page } from "@playwright/test";

/**
 * Deliverables capture (owner: Krishna). Skipped unless SHOTS=1.
 *   SHOTS=1 BASE_URL=https://<vercel-url> npx playwright test capture
 * Writes deliverables/screenshots/0N_*.png (1440x900, light mode) and a ~90 s click-path video
 * (deliverables/demo_90s.webm; convert with: ffmpeg -i demo_90s.webm -c:v libx264 -pix_fmt yuv420p demo_90s.mp4).
 */
const OUT = path.resolve(__dirname, "../../../deliverables");
const SHOTS = path.join(OUT, "screenshots");

test.skip(!process.env.SHOTS, "set SHOTS=1 to capture deliverables");

async function settle(page: Page, ms = 2500) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(ms);
}

test("screenshots", async ({ page }) => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const pages: [string, string][] = [
    ["01_command.png", "/command"],
    ["02_optimizer.png", "/optimizer"],
    ["03_rerouting.png", "/rerouting"],
    ["04_eta.png", "/eta"],
    ["05_business_case.png", "/business-case"],
  ];
  for (const [file, url] of pages) {
    await page.goto(url);
    if (url === "/command") {
      await page.getByText("% vs baseline").first().waitFor({ timeout: 30_000 });
      await page.getByRole("radio", { name: "SZR jam 13:00" }).click();
      await page.getByText(/Same 300 seeded orders/).waitFor({ timeout: 30_000 });
      const slider = page.getByLabel("Time of day");
      await slider.fill("810"); // 13:30, mid-jam
      // frame the shot from the scenario controls down (KPIs + map)
      await page.evaluate(() => {
        const el = document.querySelector('[aria-label="Scenario"]');
        if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 16);
      });
    }
    if (url === "/rerouting") {
      const go = page.getByRole("button", { name: "3 · Re-optimise" });
      await go.waitFor({ timeout: 30_000 });
      await go.click();
      await page.getByRole("button", { name: "Accept" }).waitFor({ timeout: 60_000 }); // results are in
    }
    if (url === "/optimizer") {
      await page.getByRole("checkbox").nth(2).check(); // GA too
      await page.getByRole("button", { name: "Run" }).click();
      await page.getByText(/of 300 orders served/).waitFor({ timeout: 60_000 });
    }
    await settle(page);
    await page.screenshot({ path: path.join(SHOTS, file) });
  }
});

test("demo video (~90 s click path)", async ({ browser }) => {
  test.setTimeout(240_000);
  const tmp = path.join(OUT, ".video-tmp");
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "light", recordVideo: { dir: tmp, size: { width: 1440, height: 900 } } });
  const page = await ctx.newPage();
  await page.goto("/");
  await settle(page, 6000); // landing + 3D hero
  await page.goto("/command");
  await page.getByText("% vs baseline").first().waitFor({ timeout: 30_000 });
  await settle(page, 4000);
  await page.getByRole("button", { name: "Play" }).click();
  await page.waitForTimeout(16_000); // normal day plays 08:00 -> ~13:20
  await page.getByRole("radio", { name: "SZR jam 13:00" }).click();
  await page.getByText(/Same 300 seeded orders/).waitFor({ timeout: 30_000 });
  await page.getByLabel("Time of day").fill("760");
  await page.getByRole("button", { name: "Play" }).click();
  await page.waitForTimeout(14_000); // jam window
  await page.getByRole("radio", { name: "AI", exact: true }).click();
  await page.waitForTimeout(5000);
  await page.goto("/optimizer");
  await settle(page, 2000);
  await page.getByRole("button", { name: "Run" }).click();
  await page.getByText(/of 300 orders served/).waitFor({ timeout: 60_000 });
  await page.waitForTimeout(6000);
  await page.mouse.wheel(0, 700);
  await page.waitForTimeout(8000);
  await page.goto("/rerouting");
  await settle(page, 4000);
  await page.getByRole("button", { name: "3 · Re-optimise" }).click();
  await page.getByRole("button", { name: "Accept" }).waitFor({ timeout: 60_000 });
  await page.waitForTimeout(8000); // at-risk before -> after on screen
  const video = page.video();
  await ctx.close();
  if (video) {
    fs.copyFileSync(await video.path(), path.join(OUT, "demo_90s.webm"));
  }
  fs.rmSync(tmp, { recursive: true, force: true });
});
