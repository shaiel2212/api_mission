import { test, expect } from "@playwright/test";
import { seoByPath } from "../src/config/seoRoutes";

const paths = Object.keys(seoByPath) as (keyof typeof seoByPath)[];

for (const pathname of paths) {
  test(`SEO head: ${pathname || "/"}`, async ({ page }) => {
    await page.goto(pathname === "/" ? "/" : pathname, { waitUntil: "domcontentloaded" });
    const expected = seoByPath[pathname];

    await expect(page).toHaveTitle(expected.title);

    /* מטא סטטי מ-index.html + מטא דינמי מ-Helmet — בודקים את תגיות data-rh */
    const desc = page.locator('meta[name="description"][data-rh="true"]');
    await expect(desc).toHaveAttribute("content", expected.description);

    const canonical = page.locator('link[rel="canonical"][data-rh="true"]');
    await expect(canonical).toHaveAttribute("href", /.+/);

    await expect(page.locator('meta[property="og:title"][data-rh="true"]')).toHaveAttribute(
      "content",
      expected.title
    );
    await expect(page.locator('meta[property="og:description"][data-rh="true"]')).toHaveAttribute(
      "content",
      expected.description
    );
    await expect(page.locator('meta[property="og:type"][data-rh="true"]')).toHaveAttribute(
      "content",
      "website"
    );
    await expect(page.locator('meta[property="og:locale"][data-rh="true"]')).toHaveAttribute(
      "content",
      "he_IL"
    );

    await expect(page.locator('meta[name="twitter:card"][data-rh="true"]')).toHaveAttribute(
      "content",
      "summary_large_image"
    );

    const html = page.locator("html");
    await expect(html).toHaveAttribute("lang", "he");
    await expect(html).toHaveAttribute("dir", "rtl");
  });
}
