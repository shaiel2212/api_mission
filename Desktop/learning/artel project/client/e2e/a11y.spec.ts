import { test, expect } from "@playwright/test";

test.describe("נגישות — מבנה בסיסי", () => {
  test("דילוג לתוכן ו-main landmark", async ({ page }) => {
    await page.goto("/");
    const skip = page.getByRole("link", { name: /דלג לתוכן הראשי/i });
    await skip.focus();
    await expect(skip).toBeFocused();
    await expect(skip).toHaveAttribute("href", /#main-content/);

    const main = page.locator("main#main-content");
    await expect(main).toHaveCount(1);
    await expect(main).toBeVisible();
  });

  test("כפתור תפריט נייד — aria-label", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const menuBtn = page.getByRole("button", { name: /פתח תפריט ניווט|סגור תפריט ניווט/ });
    await expect(menuBtn).toBeVisible();
    await expect(menuBtn).toHaveAttribute("aria-expanded");
  });
});
