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
