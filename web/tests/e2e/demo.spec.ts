import { expect, test, type Page } from "@playwright/test";

/**
 * Demo smoke test (owner: Krishna; Karan extends). Visits the demo pages and fails on any console error
 * or uncaught page error. Also checks that the AI plan really ran (not the stub).
 */
function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(String(e)));
  return errors;
}

test("landing page loads without console errors", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("RouteMind");
  await page.waitForTimeout(1500);
  expect(errors).toEqual([]);
});

test("/command shows real baseline vs AI KPIs, the map and the jam scenario", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto("/command");
  await expect(page.getByRole("heading", { name: "Command Center" })).toBeVisible();
  await expect(page.getByText("% vs baseline").first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("(stub)")).toHaveCount(0);
  await expect(page.locator(".maplibregl-canvas")).toBeVisible();
  await page.getByRole("radio", { name: "SZR jam 13:00" }).click();
  await expect(page.getByText(/Same 300 seeded orders/)).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: "Play" }).click();
  await page.waitForTimeout(1500);
  await page.getByRole("button", { name: "Pause" }).click();
  expect(errors).toEqual([]);
});

test("/optimizer runs the algorithms and fills the comparison", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto("/optimizer");
  await page.getByRole("button", { name: "Run" }).click();
  await expect(page.getByRole("columnheader", { name: /Clarke-Wright/ })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/of 300 orders served/)).toBeVisible();
  expect(errors).toEqual([]);
});

test("every scenario re-runs the engine, and the SZR jam shows on the map at 13:30", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto("/command");
  await expect(page.getByText("% vs baseline").first()).toBeVisible({ timeout: 30_000 });
  for (const name of ["Heavy rain", "Sandstorm 12:00", "SZR jam 13:00", "Normal day"]) {
    await page.getByRole("radio", { name }).click();
    await expect(page.getByRole("radio", { name })).toHaveAttribute("aria-checked", "true");
    await expect(page.getByText(/Same 300 seeded orders/)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("% vs baseline").first()).toBeVisible();
  }
  await page.getByRole("radio", { name: "SZR jam 13:00" }).click();
  await expect(page.getByText(/Same 300 seeded orders/)).toBeVisible({ timeout: 30_000 });
  await page.getByLabel("Time of day").fill("810");
  await expect(page.getByText(/Sheikh Zayed Road jam · 13:00-15:00/)).toBeVisible();
  await page.getByLabel("Time of day").fill("600"); // 10:00, jam not active yet
  await expect(page.getByText(/Sheikh Zayed Road jam · 13:00-15:00/)).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("dark mode toggle works, persists after reload, and pages stay error-free", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto("/command");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByText("% vs baseline").first()).toBeVisible({ timeout: 30_000 });
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bg).toBe("rgb(7, 17, 31)");
  await page.goto("/optimizer");
  await page.getByRole("button", { name: "Run" }).click();
  await expect(page.getByText(/of 300 orders served/)).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: "Switch to light mode" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect(errors).toEqual([]);
});

test("a run can be cancelled and the next run still works", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto("/optimizer");
  const result = await page.evaluate(async () => {
    const btn = (t: string) => [...document.querySelectorAll("button")].find((b) => b.textContent?.trim() === t);
    btn("Run")!.click();
    await new Promise((r) => setTimeout(r, 100));
    const cancel = btn("Cancel");
    cancel?.click();
    return Boolean(cancel);
  });
  expect(result).toBe(true);
  await expect(page.getByText(/^Cancelled\./)).toBeVisible();
  await page.getByRole("button", { name: "Run" }).click();
  await expect(page.getByText(/of 300 orders served/)).toBeVisible({ timeout: 30_000 });
  expect(errors).toEqual([]);
});

test("copilot drafts EN + AR for the most-late order without an API key", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto("/customer");
  await page.getByRole("button", { name: "Draft message" }).first().click();
  await page.getByRole("button", { name: "Draft EN + AR message" }).click();
  await expect(page.getByText(/must be HH:MM/)).toHaveCount(0);
  await expect(page.getByText(/Hello from DubaiDash Express/)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/مرحباً/)).toBeVisible();
  expect(errors).toEqual([]);
});
