// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// 静的サイトとして dist/ に出力し、Cloudflare Workers（wrangler.jsonc）で配信する。
export default defineConfig({
  // サイトの URL（検索エンジンに本来のページを伝えるときなどに使う）。独自ドメインに移ったら書き換える
  site: "https://sekkeikai-opu.sekkeikai.workers.dev",
  trailingSlash: "always",
  vite: {
    plugins: [tailwindcss()],
  },
});
