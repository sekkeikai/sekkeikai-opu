import { defineConfig, devices } from "@playwright/test";

// ビルド済みの dist/ を配信して、主要ページが壊れていないかを確かめる。
// 実行: npm run build && npm test
export default defineConfig({
  testDir: "./tests",
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:4321",
    // 環境に入っている Chromium を使いたいときは PLAYWRIGHT_CHROMIUM_PATH を指定する
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {},
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    // --ignore-lock: AI エージェントから実行したときに Astro が自動でバックグラウンド起動にしないようにする
    command: "npx astro preview --port 4321 --ignore-lock",
    url: "http://localhost:4321",
    reuseExistingServer: !process.env.CI,
  },
});
