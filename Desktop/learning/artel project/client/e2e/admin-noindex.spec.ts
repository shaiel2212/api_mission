import { test, expect } from "@playwright/test";

test.describe("אדמין — noindex", () => {
  test("דף login — meta robots", async ({ page }) => {
    await page.goto("/admin/login");
    const robots = page.locator('meta[name="robots"]');
    await expect(robots).toHaveAttribute("content", /noindex/);
  });

  test("נתיב /admin ללא סשן — מגיעים ל-login עם noindex", async ({ page }) => {
    await page.goto("/admin", { waitUntil: "networkidle" });
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });
});
