# AGENTS.md — AI コーディングツール向けのプロジェクト説明

人間向けの説明は README.md と CONTRIBUTING.md。ここには、AI（Claude Code、Copilot など）が守る決まりのうち、**コードと自動チェックからは読み取れないもの**だけを書く。

## 概要

- 大学サークル「設計会」のサイト。Astro 7（静的出力）+ Tailwind CSS 4 + GSAP/Lenis。Cloudflare Workers の静的アセットとして配信
- 記事は Sveltia CMS（`public/admin/config.yml`）から Git に保存される。内容の検証は `src/content.config.ts`（zod）
- デザイントークンの正本は `tokens/tokens.json`（DTCG 形式、Figma の Tokens Studio と同期）。`src/styles/tokens.css` は生成物で Git 管理外
- `/lab/` はデザイン確認用ページ（トークン、図、全セクションの一覧）

## 決まりの置き場所

| 何の決まりか                                                                       | 正本                                                                                        |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 文章と図の中身・構成・表記（トップページ、「設計を知る」の layer、例、出典、画像） | `docs/writing-guide.md`。**文章を書く・直す前に必ず読む**                                   |
| 入力できる値（文字数、必須の欄、URL の形）                                         | `src/content.config.ts`（zod）と `public/admin/config.yml`                                  |
| 一つの部品だけの決まり                                                             | そのファイルの冒頭のコメント（`SectionRenderer.astro`、`lib/figures.ts`、`lib/qr.ts` など） |
| 外部の画像の出典とライセンス                                                       | `docs/image-credits.md`                                                                     |
| 管理者の手順（Cloudflare、入部フォーム、年度替わり）                               | `docs/production-setup.md`、`docs/handover.md`                                              |

## コマンド

- `npm run check` … CMS 設定の検証 + astro check。必須チェック `check-and-build` は、これと `npm run build` を走らせる
- `npm run build` … `dist/` に出力。先に `check:sources`（図の出典）と `check:content`（表記・実例の重複・画像の一覧）が走る
- `npm test` … Playwright のスモークテスト（build 後）
- `npm run check:links` … 外部リンクとシラバスが開けるか（ネットにつなぐので build には入れていない。年度の初めに走らせる）

## 守ること

### 個人情報と公開リポジトリ

- 学籍番号・大学のメールアドレス・個人の連絡先は、コード・コンテンツ・サンプルデータに入れない（卒業すると無効になり、個人の特定にもつながるため）。連絡先にはサークルの共用アドレスを使う
- 問い合わせメールは、リポジトリにも HTML にもそのままの形で書かない。ビルド用の環境変数 `CONTACT_EMAIL` から読み、`src/components/ContactEmail.astro` で表示する
- サイトには GitHub のリンクと「サイトをみんなでつくっている」という文言を載せない

### コード

- UI の文言・コメントは日本語。部員の多くはプログラミング初心者なので、コメントは「何のためか」を平易に書く
- 同じものを表す場所をそろえる。セクションは `src/components/sections/*.astro`・`src/content.config.ts`・`src/components/SectionRenderer.astro`・`public/admin/config.yml` の4か所、ブロックは `src/components/Blocks.astro`・`content.config.ts` の `block`・`config.yml` の `&blocks`。文字数の上限は zod と CMS の `maxlength` で同じ値にする
- 編集画面は、空のまま残した任意の欄をファイルに書かない（`omit_empty_optional_fields`）。zod で任意の欄は `.optional()` か `.default()` にする
- 色・フォント・動きの値をコードに直接書かない。`tokens/tokens.json` に足して、Tailwind のクラスか CSS 変数で使う
- アニメーションは `src/scripts/motion.ts` にまとめる。`prefers-reduced-motion: reduce` のときは動かさず、スマートフォン（pointer: coarse）では Lenis を使わない
- 画像には意味のある `alt`（装飾なら `alt=""`）を付け、見出しの階層を飛ばさない。文字と背景の色は WCAG 2.2 の AA（本文 4.5:1 以上、大きな文字 3:1 以上）を満たす

### 公開した URL は変えない

共有されたリンクや、刷った QR コードは直せないため。

- 「設計を知る」（`src/content/design/*.yaml`）とお知らせは、ファイル名が URL になる。公開したものの名前は変えない（お知らせは `date` を変えてもファイル名はそのまま）
- QR コードの入り口 `/q/<code>/`（一覧は `src/lib/qr.ts`）は、一度使った code を消さない。行き先を変えるなら `to` だけを変える。`workers.dev` の URL も無効にしない

### 外部のサービスと依存

- 外部のサービスや道具は、まず標準の設定・使い方のまま使う。変えるのは標準では足りない理由があるときだけにし、その理由をコメントか PR に書く
- 依存パッケージを足すときは、理由を PR に書く。CDN からのスクリプト読み込みは増やさない（例外はアクセス解析の `src/components/Analytics.astro` だけ）

### 文章

- 出典は、実際に開いて主張と合っていることを確かめたものだけを、リンク付きで書く。確かめられない主張は書かない

## このファイルに決まりを足すとき

- 機械で確かめられる決まりは、ここではなくチェック（zod、`scripts/check-*.mjs`）に足す
- 文章の決まりは `docs/writing-guide.md` に、一つの部品だけの決まりはそのファイルのコメントに書く
- ここに足すのは、どのファイルを読んでも分からず、破ると困る決まりだけにする
