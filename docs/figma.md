# Figma との連携

## 方針

- **デザインの正本は GitHub**（`tokens/tokens.json` とコード）。Figma は「作業場」です
  - 教育プランは個人の資格なので、卒業や再認証忘れで Figma が使えなくなってもサイトは困らないようにするため
- 色・フォント・動きの値（トークン）は **双方向**で同期できます
- レイアウトやコンポーネントは自動では同期できません（Figma の制限）。代わりに、ときどき実際のサイトを Figma に取り込みます

## 席を Full にする（初回のみ）

View 席のままだと Figma で編集できません。

1. Figma で「設計会」チームを開き、新しいデザインファイルを作ろうとする（または既存ファイルで「編集を開始」）
2. 出てきた申請を送る。教育認証が有効なら自動で承認されます
3. うまくいかないときは、管理者がチームの「メンバー」画面で席を変更するか、[教育認証](https://www.figma.com/education/)が切れていないか確認

## トークンの同期（Tokens Studio）

### 最初の設定（ファイルごとに一度）

1. Figma で「設計会」チームにトークン用のファイルを作る（例: `Design Tokens`）
2. プラグイン「**Tokens Studio for Figma**」を開く
3. Settings → Sync providers →「Add new」→ **GitHub**
   - Personal Access Token: 自分の GitHub で作る
     - GitHub → Settings → Developer settings → Fine-grained tokens →「Generate new token」
     - Resource owner: **sekkeikai**（Organization。承認待ちになったら Organization の Owner に承認してもらう）
     - Repository access: このリポジトリだけ / Permissions: Contents を **Read and write**
     - 有効期限は 1 年以内にする。切れたら作り直して Tokens Studio に貼り直す
   - Repository: `sekkeikai/sekkeikai-opu`
   - Branch: `main`
   - File path: `tokens/tokens.json`
   - Token format（Settings の中）: **W3C DTCG**（`$value` / `$type` の形式）を選ぶ。旧形式だとサイトのビルドがエラーで止まります
4. 「Pull from GitHub」→ トークンが読み込まれる
5. Styles & Variables →「Export to Figma」→ Variables として使えるようになる

### GitHub → Figma（コード側で値が変わったとき）

`tokens/tokens.json` が変わると、GitHub に「Figma 同期待ち」Issue が自動で立ちます。

1. トークン用ファイルを開き、Tokens Studio で **Pull**
2. **Export to Figma**（Variables を更新）
3. Issue を閉じる

### Figma → GitHub（Figma で値を変えたいとき）

1. 先に **Pull** して最新にする
2. Tokens Studio 上で値を変える
3. **Push** → 「新しいブランチを作る」を選ぶ（例: `design/change-orange`）
4. GitHub で、そのブランチから PR を作る → プレビュー URL の `/lab/` で確認 → マージ

> main に直接 Push しようとすると、ruleset で拒否されます（それで正常です）。
>
> Tokens Studio の無料版で「新しいブランチに Push」が選べない場合は、
> 先に GitHub のリポジトリ画面でブランチを作り（ブランチ一覧 →「New branch」）、
> Tokens Studio の同期設定の Branch をそのブランチ名に変えてから Push してください。終わったら `main` に戻します。

### ぶつかったら

同じ値を GitHub と Figma の両方で同時に変えた場合は、GitHub の PR 上で「どちらを採用するか」を決めます。
迷ったら GitHub 側（main）が正です。

## 実際のサイトを Figma に取り込む（スナップショット）

レイアウトを Figma 上で検討したいときに使います。Figma MCP（AI から Figma を操作する仕組み）を使います。

1. 手元か Codespaces で `npm run dev` を起動
2. Claude Code など Figma MCP に対応した AI ツールで、Figma にログインして次のように頼む
   - 「`http://localhost:4321/lab/` を Figma の『設計会』チームの `Code Snapshot` ファイルに取り込んで。ページ名は今日の日付とコミット番号で」
3. 取り込んだページは **上書きされる前提の参照用**です。デザイン案は複製した別ページで作ってください

## Figma が使えなくなったら

- `tokens/tokens.json` と、確定したデザインの画像（PNG/PDF）を GitHub に置いてあるので、サイトの作業は続けられます
- 代わりのデザインツールとして [Penpot](https://penpot.app/)（オープンソース、組織で無料）が使えます。トークンは Tokens Studio 形式で読み込めます
