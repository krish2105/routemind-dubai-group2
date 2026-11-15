import { expect, test, type Page } from "@playwright/test";

/**
 * Live re-routing demo path (Karan's area, built by Yash): the SZR jam at 13:00 is pre-loaded, Re-optimise runs in the
 * worker, the before/after numbers and the SLA-at-risk list appear, and the dispatcher can accept. No console errors.
 */
function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(String(e)));
  return errors;
}

test("/rerouting: SZR jam, Re-optimise, before/after, accept", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto("/rerouting");
  await expect(page.getByText("Sheikh Zayed Road jam").first()).toBeVisible();
  const go = page.getByRole("button", { name: "3 · Re-optimise" });
  await expect(go).toBeEnabled({ timeout: 30_000 }); // morning plan ready in the worker
  await go.click();
  await expect(page.getByText(/stops frozen, \d+ re-planned/)).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("SLA-at-risk list")).toBeVisible();
  await expect(page.getByRole("button", { name: "Accept" })).toBeEnabled();
  await page.getByRole("button", { name: "Accept" }).click();
  await expect(page.getByText(/Dispatcher accepted/)).toBeVisible();
  expect(errors).toEqual([]);
});

test("/rerouting: urgent surge inserts new orders", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto("/rerouting");
  await page.getByRole("button", { name: /Urgent surge/ }).click();
  const go = page.getByRole("button", { name: "3 · Re-optimise" });
  await expect(go).toBeEnabled({ timeout: 30_000 });
  await go.click();
  await expect(page.getByText(/new urgent orders/)).toBeVisible({ timeout: 30_000 });
  expect(errors).toEqual([]);
});
