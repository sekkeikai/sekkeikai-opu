import { test, expect } from "@playwright/test";

// 主要ページが表示でき、JavaScript のエラーが出ていないことを確かめる
const pages = [
  "/",
  "/news/",
  "/design/",
  // 「設計を知る」の種類ごとに1ページずつ（全体・工程・視点・設計の流れの例・その他のテーマ・分野）
  "/design/process/",
  "/design/requirements/",
  "/design/modeling/",
  "/design/case-open-campus/",
  "/design/design-methods-history/",
  "/design/simulation/",
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

test("分野のページは、親のページと一覧からたどれ、親のページへ戻れる", async ({ page }) => {
  // 親のページの終わりに、分野のページが並ぶ
  await page.goto("/design/modeling/");
  await expect(page.locator('#fields a[href="/design/simulation/"]')).toBeVisible();
  // 一覧では、親のカードの下にリンクが出る
  await page.goto("/design/");
  await expect(page.locator('a[href="/design/simulation/"]')).toBeVisible();
  // 分野のページの上に、親のページへのリンクが出る
  await page.goto("/design/simulation/");
  await expect(page.locator('header a[href="/design/modeling/"]')).toBeVisible();
});

test("モンテカルロ法の図は、ボタンを押すと点が増える", async ({ page }) => {
  await page.goto("/design/simulation/");
  const total = page.locator("[data-montecarlo-total]");
  await expect(total).toHaveText("200");
  await page.locator('[data-montecarlo-add="100"]').click();
  await expect(total).toHaveText("300");
  await expect(page.locator("[data-montecarlo-dots] circle")).toHaveCount(300);
});

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

test("QR コードの入り口 /q/poster/ は、検索結果に出さず、トップページへ移る", async ({ page }) => {
  const res = await page.request.get("/q/poster/");
  expect(res.status()).toBe(200);
  const html = await res.text();
  expect(html).toContain('<meta name="robots" content="noindex">');
  // 手元ではアクセス解析を読み込まないので、すぐにトップページへ移る
  await page.goto("/q/poster/");
  await page.waitForURL((url) => url.pathname === "/");
  await expect(page.locator("#join-title")).toBeAttached();
});

test("CMS の編集画面 /admin/ が配信されている", async ({ page }) => {
  const res = await page.goto("/admin/");
  expect(res?.status()).toBe(200);
});

test("存在しないページは 404 ページを返す", async ({ page }) => {
  await page.goto("/no-such-page/");
  await expect(page.getByText("このページは、まだ設計されていません。")).toBeVisible();
});
