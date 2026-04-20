import { test, expect } from "@playwright/test";

test("גופני Google — בקשה עם subset", async ({ page }) => {
  const hrefs: string[] = [];
  page.on("response", async (res) => {
    const url = res.url();
    if (url.includes("fonts.googleapis.com") && url.includes("css2")) {
      hrefs.push(url);
    }
  });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  expect(hrefs.some((h) => h.includes("subset=") || h.includes("hebrew"))).toBeTruthy();
});

test("ריצה ראשונית — לא לטעון iframe_api מיד (חלון ראשון קצר)", async ({ page }) => {
  const early = new Set<string>();
  const t0 = Date.now();
  page.on("request", (req) => {
    if (Date.now() - t0 < 150 && req.url().includes("youtube.com/iframe_api")) {
      early.add(req.url());
    }
  });
  await page.goto("/");
  await new Promise((r) => setTimeout(r, 200));
  expect(early.size, "iframe_api לא אמור להיטען ב־150ms הראשונים (דחייה ל-idle)").toBe(0);
});
