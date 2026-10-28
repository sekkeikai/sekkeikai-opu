// ポスターやチラシの QR コードの入り口の一覧。1 行が 1 つの QR コード。
// QR コードには https://<サイトの URL>/q/<code>/ を入れる。開くと、アクセス解析に「/q/<code>/ が見られた」と記録してから、to のページへ移る。
// - /q/ はこの一覧のためだけに使う(ほかのページを /q/ の下に作らない。普通のページと名前がぶつからないように)
// - アクセス解析(Cloudflare Web Analytics)で Path を /q/<code>/ に絞ると、その QR コードから来た人の数が見られる
// - 刷った QR コードは直せないので、一度使った code は消さない。行き先を変えたいときは to だけを変える
// - code は英小文字・数字・ハイフン。短いほど QR コードの模様が細かくならず、読み取りやすい
export interface QrEntry {
  code: string;
  // 移る先(サイトの中のページ。例: "/"、"/design/")
  to: string;
  // 何に刷った QR コードか(覚え書き。サイトには出ない)
  note: string;
}

export const qrEntries: QrEntry[] = [{ code: "poster", to: "/", note: "2026年度 新歓ポスター" }];
