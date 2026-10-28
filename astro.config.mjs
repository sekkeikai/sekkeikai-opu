// @ts-check
import { defineConfig, envField } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// 静的サイトとして dist/ に出力し、Cloudflare Workers（wrangler.jsonc）で配信する。
export default defineConfig({
  // サイトの URL（検索エンジンに本来のページを伝えるときなどに使う）。独自ドメインに移ったら書き換える
  site: "https://sekkeikai-opu.sekkeikai.workers.dev",
  trailingSlash: "always",
  // ビルドのときに読む設定(環境変数)。値は Cloudflare の「ビルド用の環境変数」に入れ、リポジトリには書かない
  env: {
    schema: {
      // 問い合わせ用のメールアドレス。公開リポジトリに載せると、アドレスを集めるボットに拾われるので、ここから読む。
      // 空の間は、フッターに「準備中」と出る(手元のビルドや GitHub のチェックでは空になる)
      CONTACT_EMAIL: envField.string({ context: "server", access: "public", optional: true }),
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
