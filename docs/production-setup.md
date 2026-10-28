# 本番環境の準備（管理者向け・最初に一度だけ）

所要時間の目安: 1〜2 時間。順番どおりに進めてください。
アカウントはすべて **サークルの共用メール**（個人のメールではなく）で作ると、引き継ぎが楽になります。

- [0. 全体像](#0-全体像)
- [1. GitHub の準備](#1-github-の準備)
- [2. Cloudflare で公開する](#2-cloudflare-で公開する)
- [3. 編集画面のログインを使えるようにする](#3-編集画面のログインを使えるようにする)
- [4. 仕上げ（独自ドメインなど）](#4-仕上げ独自ドメインなど)
- [元に戻す](#元に戻す)

## 0. 全体像

| サービス                               | 役割                                                      | 費用             |
| -------------------------------------- | --------------------------------------------------------- | ---------------- |
| GitHub（Organization・公開リポジトリ） | ソースの正本、PR、自動チェック                            | 無料             |
| Cloudflare Workers                     | サイトの公開、PR ごとのプレビュー、編集画面のログイン中継 | 無料枠           |
| Figma（教育プラン）                    | デザイン                                                  | 無料（学生認証） |

## 1. GitHub の準備

### 1-1. Organization の確認

このリポジトリは Organization `sekkeikai` が持っています（個人アカウントに依存しないため、代替わりしても残ります）。

1. Organization の Owner を **2〜3 人**にする（顧問の先生か OB を 1 人入れると安心）
2. 公開前は、Organization の Settings → Member privileges → **Base permissions** を「No permission」にしておくと、
   private リポジトリの中身が部員全員に見えてしまうのを防げます（公開後は戻して構いません）
3. リポジトリ名を変える・別の Organization に移すときは、`git grep sekkeikai/sekkeikai-opu` で出てくる場所を書き換える

### 1-2. メンバーの追加

1. Organization → Teams →「New team」で `members`（部員全員）を作る
2. リポジトリの Settings → Collaborators and teams → `members` を **Write** 権限で追加
3. 部員を `members` に招待する（年度ごとに見直す。[handover.md](handover.md)）

### 1-3. main ブランチを守る（ruleset）

誰でも触れる代わりに、「PR を通す」「チェックが通らないと公開しない」ようにします。

1. リポジトリの Settings → Rules → Rulesets →「New ruleset」→「**Import a ruleset**」
2. このリポジトリの [`.github/rulesets/main.json`](../.github/rulesets/main.json) を選ぶ
3. 内容を確認して「Create」

インポートできない場合は「New branch ruleset」から手で設定します。

- Ruleset name: `main を守る` / Enforcement status: **Active**
- Target branches: **Include default branch**
- ルール
  - ✅ Restrict deletions
  - ✅ Block force pushes
  - ✅ Require a pull request before merging（Required approvals は **0**。誰でもすぐ公開できるようにするため）
  - ✅ Require status checks to pass → 「Add checks」で **`check-and-build`** を追加
    （一度 PR を出して CI が動いたあとでないと候補に出ません）
- Bypass list: 緊急用に Organization admin を入れておいてもよい

> 承認を必須にしたくなったら（例: レイアウトの変更だけ）、`.github/CODEOWNERS` を作って
> 「Require review from Code Owners」をオンにします。まずは承認なしで始めて、困ったら足すのがおすすめです。

### 1-4. その他の設定

- Settings → General → Pull Requests: 「Allow auto-merge」と「Automatically delete head branches」をオン
- Settings → Code security: **Secret scanning** と **Push protection** をオン（公開リポジトリは無料）
- Settings → Actions → General → Workflow permissions: 「Read and write permissions」は不要（ワークフロー側で必要な権限だけ指定済み）

## 2. Cloudflare で公開する

1. [Cloudflare](https://dash.cloudflare.com/sign-up) にサークルの共用メールで登録
2. ダッシュボード → **Workers & Pages** →「Create」→「Import a repository」→ GitHub を連携してこのリポジトリを選ぶ
3. 設定

   | 項目                                 | 値                                                                               |
   | ------------------------------------ | -------------------------------------------------------------------------------- |
   | Project name                         | `sekkeikai-opu`（`wrangler.jsonc` の `name` と同じにする）                       |
   | Build command                        | `npm run build`                                                                  |
   | Deploy command                       | `npx wrangler deploy`                                                            |
   | Non-production branch deploy command | `npx wrangler versions upload`（PR ごとのプレビュー URL 用）                     |
   | Root directory                       | `/`                                                                              |
   | 環境変数（Build）                    | `NODE_VERSION` = `24.22.1`（`.node-version` と同じ。自動で読まれない場合の保険） |
   | 環境変数（Build）                    | `CONTACT_EMAIL` = 問い合わせ用の共用アドレス（下の「問い合わせメール」）         |

4. 「Deploy」。数分で `https://sekkeikai-opu.<アカウント名>.workers.dev` に公開されます
5. Settings → Builds で次をオンにする
   - 「**Builds for non-production branches**」… PR（main 以外のブランチ）でもビルドしてプレビュー URL を作る
   - 「**Pull request comments**」… PR にプレビュー URL を自動で書き込む
6. 他の管理者は Manage Account → Members から招待（パスワードを共有しない）

> 手元から確かめる: `npm run build && npx wrangler deploy --dry-run`（アップロードせずに設定だけ検査）

### 問い合わせメール

フッターに出す問い合わせ用のメールアドレスは、`links.yaml` ではなく、ビルド用の環境変数 `CONTACT_EMAIL` に入れます。
このリポジトリは公開なので、ファイルに書くとアドレスを集めるボットに拾われ、迷惑メールが届くようになるためです。
サイトの HTML にもそのままの形では書かず、ブラウザーで JavaScript が組み立てて表示します（`src/components/ContactEmail.astro`）。

- 入れる場所: Workers & Pages → `sekkeikai-opu` → Settings → Build の環境変数（上の表の `NODE_VERSION` と同じ場所）
- 入れるアドレス: 団体で共有しているアドレスだけ。迷惑メールが増えたら捨てて替えられるよう、問い合わせ専用の別名にしておくとよい。大学の個人用アドレスを入れるとビルドが止まる
- 変えたとき: 次のビルドから反映されます。すぐ反映するには、最新のビルドをやり直します
- 空のとき: フッターに「メール(準備中)」と出ます。GitHub のチェックや、設定していない手元のビルドでは空なので、こう出るのが正しい動き
- 手元で表示を確かめる: リポジトリのいちばん上に `.env` というファイルを作り、`CONTACT_EMAIL=アドレス` と1行書いて `npm run dev`（`.env` は Git に入らない設定なので、アドレスが公開されることはない）

## 3. 編集画面のログインを使えるようにする

編集画面（`/admin`）で「Sign In with GitHub」を使うには、ログインを中継する小さな Worker が必要です。
（それまでは、Chrome / Edge で「Work with Local Repository」を選べば、手元に clone したフォルダを直接編集できます）

### 3-1. 中継用 Worker を作る

1. [sveltia/sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth) を開き、README の「Deploy to Cloudflare Workers」ボタンから自分の Cloudflare にデプロイ
2. できた Worker の URL を控える（例: `https://sveltia-cms-auth.<アカウント名>.workers.dev`）

### 3-2. GitHub の OAuth App を作る

1. **Organization** の Settings → Developer settings → OAuth Apps →「New OAuth App」
   （個人ではなく Organization で作ると、引き継ぎで困りません）
2. 入力
   - Application name: `設計会 編集画面`
   - Homepage URL: サイトの URL
   - Authorization callback URL: `https://sveltia-cms-auth.<アカウント名>.workers.dev/callback`
3. 作成後、Client ID と「Generate a new client secret」で Client secret を控える

### 3-3. Worker に設定を入れる

Cloudflare → 中継用 Worker → Settings → Variables and Secrets に追加（Secret として保存）

| 名前                   | 値                                                                                                                                                                                                                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GITHUB_CLIENT_ID`     | 3-2 の Client ID                                                                                                                                                                                                                                                            |
| `GITHUB_CLIENT_SECRET` | 3-2 の Client secret                                                                                                                                                                                                                                                        |
| `ALLOWED_DOMAINS`      | サイトのドメイン（例: `sekkeikai-opu.<アカウント名>.workers.dev`。独自ドメインを使うならそれも、カンマ区切りで）。プレビュー URL の `/admin` でもログインしたい場合は `*.sekkeikai-opu.<アカウント名>.workers.dev` のようなワイルドカードも足す（使えるかは README で確認） |

正確な変数名は sveltia-cms-auth の README に従ってください（変わることがあります）。

### 3-4. 編集画面に中継先を教える

`public/admin/config.yml` の `base_url` を、3-1 で作った Worker の URL に書き換えて、PR → マージ。
`/admin` で「Sign In with GitHub」が使えるようになります。

> Organization に「OAuth App access restrictions」が掛かっている場合は、
> Organization の Settings → OAuth application policy で `設計会 編集画面` を承認してください。

## 4. 仕上げ（独自ドメインなど）

- **独自ドメイン**: 大学のサブドメインを使うなら情報センターに相談。自分たちで取るならサークル名義で取得し、Cloudflare の Worker → Settings → Domains & Routes で追加。取得したら `astro.config.mjs` の `site` と、Web Analytics にそのドメインのサイトも足す。**`workers.dev` の URL は無効にしない**（ポスターの QR コードがこの URL を指しているため）
- **入部フォーム**: 編集画面の「サイトの設定 → 入部フォーム・連絡先とリンク」で Microsoft Forms の URL を入れる
- **Figma 連携**: [figma.md](figma.md)

## 5. アクセス解析とポスターの QR コード

### 5-1. アクセス解析（Cloudflare Web Analytics）を始める

Cookie を使わず、個人を特定しない数え方（ページごとの閲覧数、端末、国など）で、どのページが見られたかを Cloudflare の管理画面で見られます。

1. Cloudflare の管理画面で「Web Analytics」を開き、サイトを追加する。ホスト名は `sekkeikai-opu.sekkeikai.workers.dev`
2. 表示される JS スニペットの中の `"token": "…"` の値を控える（公開してよい値です）
3. `src/lib/analytics.ts` の `analyticsToken` にその値を書いて、PR → マージ

記録されるのは、登録したホスト名で開いたときだけです。PR のプレビューや手元の確認で開いても、数はまざりません。
画面の名前は Cloudflare 側で変わることがあります。見つからないときは Cloudflare のドキュメントで「Web Analytics」を探してください。

**数が出ないとき**: パソコンの Chrome で本番のトップページを開き、開発者ツール（F12）の「Network」で `cloudflareinsights` に絞って再読み込みする。`beacon.min.js`（200）と、`cloudflareinsights.com` への送信（`rum`、204 など）が出ていれば、サイト側は正しく動いている。出ていなければ、広告ブロックなどで止められているか、`src/lib/analytics.ts` の token とホスト名を確かめる。

### 5-2. ポスターの QR コード

- QR コードには `https://sekkeikai-opu.sekkeikai.workers.dev/q/<code>/` を入れる（今あるのは `/q/poster/`）。開くと、アクセス解析が記録を送り終えるのを待ってからトップページへ移る（ふつうは1〜2秒、長くて5秒）。アドレス欄は最後にトップページの URL になるので、人に送られたリンクで数が増えることはない
- QR コードの一覧は `src/lib/qr.ts`。1 行が 1 つの QR コードで、`code`（URL の最後の部分）・`to`（行き先）・`note`（何に刷ったか）を書く。ポスターやチラシごとに行を足すと、どれから来たかを分けて数えられる
- Web Analytics の画面で、Path を `/q/poster/` に絞ると、その QR コードから来た人の数と日ごとの変化が見られる（Web Analytics は `?from=…` のような URL の後ろの部分を数えないので、ページの場所を分けている）
- `/q/` は QR コードの入り口だけに使う。ほかのページを `/q/` の下に作るとビルドが止まるので、普通のページと名前がぶつかることはない
- 刷った QR コードは直せないので、一度使った `code` は消さない。行き先を変えたいときは `to` だけを変える

## 元に戻す

| 状況                             | 方法                                                                                                                                      |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| ある変更で崩れた（ふだんはこれ） | GitHub で該当 PR を開く →「Revert」→ できた PR をマージ                                                                                   |
| サイト全体が表示されない（緊急） | Cloudflare → Worker → Deployments → 正常だった版の「…」→「Rollback」。**そのあと必ず原因の PR を Revert**（しないと次の公開でまた壊れる） |
