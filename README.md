# 設計会ホームページ

岡山県立大学の設計サークル「設計会」のホームページです。**部員みんなで作り、育てていきます。**
プログラミングの経験がなくても参加できます。

## まずはここから

やりたいことに合わせて、ガイドを選んでください。

| やりたいこと                                                       | 必要なもの                                       | ガイド                                                                                                    |
| ------------------------------------------------------------------ | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| お知らせ・「設計を知る」のページを書く、トップページの文章を変える | ブラウザと GitHub アカウント                     | [CONTRIBUTING.md の「A. ブラウザで記事を書く」](CONTRIBUTING.md#a-ブラウザで記事を書くプログラミング不要) |
| 色・フォント・動きなどのデザインを変える                           | Figma（教育プラン）                              | [CONTRIBUTING.md の「B. デザインを変える」](CONTRIBUTING.md#b-デザインを変えるfigma)                      |
| レイアウトや新しいセクション、アニメーションを作る                 | GitHub Codespaces（ブラウザだけで可）か自分の PC | [CONTRIBUTING.md の「C. コードを書く」](CONTRIBUTING.md#c-コードを書く)                                   |
| 「こうしたい」というアイデアや不具合を伝える                       | GitHub アカウント                                | [Issue を作る](../../issues/new/choose)                                                                   |

わからないことは、遠慮なく Issue かサークルのチャットで聞いてください。

## 仕組み（ざっくり）

```
 Figma（デザイン）──Tokens Studio──┐
                                  ▼
 ブラウザの編集画面 /admin ──▶ GitHub（このリポジトリ＝正本）──▶ Cloudflare（公開）
 VS Code / Codespaces   ──────┘        │                        ├ main: 本番サイト
                                      └ PR ごとに自動チェック  └ PR: 確認用プレビュー URL
```

- どこから変更しても、必ず **PR（プルリクエスト）** になります。自動チェックが通り、プレビューで見た目を確かめてから公開します。
- 失敗しても大丈夫です。GitHub の「Revert」ボタンでいつでも元に戻せます。

## フォルダの地図

| 場所                          | 中身                                               | 誰が触る？                   |
| ----------------------------- | -------------------------------------------------- | ---------------------------- |
| `src/content/news/`           | お知らせ記事（Markdown）                           | 編集画面から誰でも           |
| `src/content/design/`         | 「設計を知る」のページ（YAML。ファイル名が URL）   | 編集画面から誰でも           |
| `src/content/pages/home.yaml` | トップページのセクション構成と文章                 | 編集画面から誰でも           |
| `src/content/site/links.yaml` | Discord・TimeTree・問い合わせメール                | 編集画面から誰でも           |
| `public/uploads/`             | 画像（外部の画像の出典は `docs/image-credits.md`） | 編集画面から自動で           |
| `tokens/tokens.json`          | 色・フォント・動きの値（デザインの正本）           | Figma（Tokens Studio）か手で |
| `src/components/sections/`    | セクションの見た目（Astro）                        | コードを書く人               |
| `src/components/Blocks.astro` | 長文の部品（要点・問いかけ・例・表など）の見た目   | コードを書く人               |
| `src/components/figures/`     | 図（一覧は `/lab/`）                               | コードを書く人               |
| `src/scripts/motion.ts`       | アニメーション（GSAP / Lenis）                     | コードを書く人               |
| `src/content.config.ts`       | 入力内容のルール（文字数の上限など）               | コードを書く人               |
| `public/admin/config.yml`     | 編集画面の入力欄の設定                             | コードを書く人               |
| `docs/writing-guide.md`       | 文章の書き方（調べたことと、このサイトの決まり）   | 文章を書く人                 |
| `docs/`                       | 管理者向けの手順書                                 | 管理者                       |

## 使っている技術

| 役割           | 採用                                                                     | 理由（一言）                                                 |
| -------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------ |
| サイト生成     | [Astro](https://astro.build/) 7                                          | 速い。HTML に近く覚えやすい。動きが必要な所だけ JS を使える  |
| スタイル       | [Tailwind CSS](https://tailwindcss.com/) 4                               | デザイントークンをそのまま CSS 変数として使える              |
| アニメーション | [GSAP](https://gsap.com/) + [Lenis](https://lenis.darkroom.engineering/) | 無料・商用可。凝った演出に強い                               |
| 編集画面       | [Sveltia CMS](https://sveltiacms.app/)                                   | 無料・人数無制限・日本語。編集内容が GitHub に PR として届く |
| 公開           | [Cloudflare Workers](https://developers.cloudflare.com/workers/)         | 無料枠が大きい。PR ごとにプレビュー URL                      |
| デザイン       | Figma（教育プラン）+ Tokens Studio                                       | 色などの値を GitHub と同期できる                             |

## よく使うコマンド（コードを書く人向け）

```bash
npm ci            # 最初に一度（依存パッケージのインストール）
npm run dev       # 開発用サーバー → http://localhost:4321
npm run check     # 型・設定のチェック（CI と同じ）
npm run build     # 本番用にビルド → dist/（先に図の出典と文章の決まりを確かめる）
npm test          # 主要ページの自動テスト（build のあとに）
npm run preview   # 本番と同じ Cloudflare の仕組みでローカル配信 → http://localhost:8787
npm run check:content  # 文章の決まり・同じ実例の重複・画像の一覧を確かめる（build でも自動で走る）
npm run check:links    # 外部リンクとシラバスのページが開けるか（ネットにつなぐ。年度の初めに）
```

Node.js は `.node-version` に書いてあるバージョン（24 系）を使ってください。

## 管理者向け

- [本番環境の準備（最初に一度）](docs/production-setup.md)
- [Figma との連携](docs/figma.md)
- [年度替わりの引き継ぎチェックリスト](docs/handover.md)

## ライセンス

- プログラム（`src/`, `scripts/` など）: [MIT License](LICENSE)
- 文章・写真・ロゴ・デザインなどのコンテンツ（`src/content/`, `public/uploads/` など）: © 設計会。無断転載はご遠慮ください。詳しくは [CONTENT-LICENSE.md](CONTENT-LICENSE.md)
