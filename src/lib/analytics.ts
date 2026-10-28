// アクセス解析(Cloudflare Web Analytics)の設定。
// Cookie を使わず、個人を特定しない数え方(ページごとの閲覧数・端末・国など)だけを集める。
// 結果は Cloudflare の管理画面の「Web Analytics」で見られる(手順は docs/production-setup.md の「アクセス解析」)。
//
// - token が空の間は、何も読み込まない
// - 読み込むのは、下の hostname で開いたときだけ。PR のプレビュー・手元の確認・自動テストでは読み込まない(数がまざらないように)
// - 独自ドメインに移ったら、hostname を書き換え、Web Analytics にもそのドメインを足す

// Web Analytics で「サイトを追加」したときに出る JS スニペットの token の値(公開してよい値)
export const analyticsToken = "";

// 本番のサイトのホスト名
export const analyticsHostname = "sekkeikai-opu.sekkeikai.workers.dev";
