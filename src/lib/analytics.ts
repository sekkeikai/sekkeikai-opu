// アクセス解析(Cloudflare Web Analytics)の設定。
// Cookie を使わず、個人を特定しない数え方(ページごとの閲覧数・端末・国など)だけを集める。
// 結果は Cloudflare の管理画面の「Web Analytics」で見られる(手順は docs/production-setup.md の「アクセス解析」)。
// - token が空の間は、何も読み込まない
// - 記録されるのは、Web Analytics に登録したホスト名(sekkeikai-opu.sekkeikai.workers.dev)で開いたときだけ。
//   独自ドメインに移ったら、Web Analytics にもそのドメインを足す

// Web Analytics で「サイトを追加」したときに出る JS スニペットの token の値(公開してよい値)
export const analyticsToken = "1b9b165dcc944b519800be4a9858ca68";
