# AGENTS.md — AI コーディングツール向けのプロジェクト説明

人間向けの説明は README.md と CONTRIBUTING.md。ここは AI（Claude Code、Copilot など）が守るべきルール。

## 概要

- 大学サークル「設計会」のサイト。Astro 7（静的出力）+ Tailwind CSS 4 + GSAP/Lenis。Cloudflare Workers の静的アセットとして配信
- 記事は Sveltia CMS（`public/admin/config.yml`）から Git に保存される。内容の検証は `src/content.config.ts`（zod）
- デザイントークンの正本は `tokens/tokens.json`（DTCG 形式、Figma の Tokens Studio と同期）。`src/styles/tokens.css` は生成物で Git 管理外

## コマンド

- `npm run check` … CMS 設定の検証 + astro check（必須チェックと同じ）
- `npm run build` … `dist/` に出力
- `npm test` … Playwright のスモークテスト（build 後）

## ルール

- UI の文言・コメントは日本語。部員の多くはプログラミング初心者なので、コメントは「何のためか」を平易に書く
- セクションを追加・変更したら、次の 4 か所をそろえる: `src/components/sections/*.astro`、`src/content.config.ts`、`src/components/SectionRenderer.astro`、`public/admin/config.yml`。文字数上限は zod と CMS の `maxlength` で同じ値にする
- 色・フォント・動きの値をコードに直接書かない。`tokens/tokens.json` に足して Tailwind のクラスや CSS 変数で使う
- アニメーションは `src/scripts/motion.ts` に集約。`prefers-reduced-motion: reduce` のときは動かさない。スマホ（pointer: coarse）では Lenis を使わない
- 画像には意味のある `alt`（装飾なら `alt=""`）。見出しの階層を飛ばさない
- 代表者の氏名はサイトに載せてよいが、年度ごとに変わるのでコードに直接書かず、`home.yaml` の団体概要（info セクション）に置く
- 学籍番号・大学のメールアドレス・個人の連絡先はコード・コンテンツ・サンプルデータに入れない（卒業すると無効になり、個人の特定にもつながるため）。連絡先が必要ならサークルの共用アドレスや問い合わせフォームを使う
- 依存パッケージを追加するときは理由を PR に書く。CDN からのスクリプト読み込みは増やさない
