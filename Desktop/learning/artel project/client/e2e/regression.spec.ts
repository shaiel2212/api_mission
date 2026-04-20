import { test, expect } from "@playwright/test";

test.describe("רגרסיה קלה", () => {
  test("פוטר — קישורים משפטיים", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer.getByRole("link", { name: "פרטיות", exact: true })).toHaveAttribute("href", "/privacy");
    await expect(footer.getByRole("link", { name: "תנאי שימוש", exact: true })).toHaveAttribute("href", "/terms");
    await expect(footer.getByRole("link", { name: "נגישות", exact: true })).toHaveAttribute(
      "href",
      "/accessibility"
    );
  });

  test("דף צור קשר — טופס נוכחות", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByLabel(/שם מלא/)).toBeVisible();
    await expect(page.getByLabel(/טלפון/)).toBeVisible();
  });
});
