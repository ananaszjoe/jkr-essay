import { expect, test } from "@playwright/test";

test("component catalog", async ({ page }) => {
  await page.goto("/#components");
  await page.locator(".components-intro").waitFor({ state: "visible" });
  await page.evaluate(() => document.fonts.ready);

  await expect(page).toHaveScreenshot("component-catalog.png", {
    fullPage: true
  });
});
