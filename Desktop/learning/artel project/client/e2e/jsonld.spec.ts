import { test, expect } from "@playwright/test";

test("JSON-LD — LocalBusiness ו-WebSite ב-graph", async ({ page }) => {
  await page.goto("/");
  const jsonLd = page.locator('script[type="application/ld+json"]');
  await expect(jsonLd).toHaveCount(1);
  const raw = await jsonLd.textContent();
  expect(raw).toBeTruthy();
  const data = JSON.parse(raw!) as { "@context"?: string; "@graph"?: unknown[] };
  expect(data["@context"]).toBe("https://schema.org");
  expect(Array.isArray(data["@graph"])).toBe(true);
  const types = (data["@graph"] as { "@type"?: string }[]).map((n) => n["@type"]);
  expect(types).toContain("LocalBusiness");
  expect(types).toContain("WebSite");
});
