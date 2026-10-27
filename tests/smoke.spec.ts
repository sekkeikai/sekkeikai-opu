import { test, expect } from "@playwright/test";

// 主要ページが表示でき、JavaScript のエラーが出ていないことを確かめる
const pages = [
  "/",
  "/news/",
  "/design/",
  // 「設計を知る」の種類ごとに1ページずつ（全体・工程・視点・設計の流れの例・その他のテーマ）
  "/design/process/",
  "/design/requirements/",
  "/design/modeling/",
  "/design/case-open-campus/",
  "/design/design-methods-history/",
  "/lab/",
];

for (const path of pages) {
  test(`${path} が表示できる`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1").first()).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("横スクロールが発生しない（スマホ幅でもはみ出さない）", async ({ page }) => {
  await page.goto("/");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("視差効果を減らす設定ではアニメーションなしで全文が見える", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator("html")).not.toHaveClass(/motion-ready/);
  await expect(page.locator("#join-title")).toBeVisible();
  await context.close();
});

test("スクロールすると要素が現れる（アニメーションが動いている）", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/motion-ready/);
  await page.locator("#join").scrollIntoViewIfNeeded();
  // 動きの長さは tokens.json の motion.duration-base（0.7 秒）なので、数秒以内に表示しきるはず
  await expect(page.locator("#join-title")).toHaveCSS("opacity", "1", { timeout: 5000 });
});

test("CMS の編集画面 /admin/ が配信されている", async ({ page }) => {
  const res = await page.goto("/admin/");
  expect(res?.status()).toBe(200);
});

test("存在しないページは 404 ページを返す", async ({ page }) => {
  await page.goto("/no-such-page/");
  await expect(page.getByText("このページは、まだ設計されていません。")).toBeVisible();
});
