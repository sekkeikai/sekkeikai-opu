// 連絡先とリンク(src/content/site/links.yaml)を、表示に使う形にそろえる。
// ヘッダーのアイコンとフッターで同じものを使う。
// 問い合わせメールだけは links.yaml に置かず、ビルド用の環境変数 CONTACT_EMAIL から読む(getContactEmail)。
import { getEntry } from "astro:content";
import { CONTACT_EMAIL } from "astro:env/server";

export interface SiteLink {
  name: string;
  // 押したときの行き先。空の間は ""(まだ用意できていない)
  href: string;
  // 押す前に、何が起きるかが分かる説明(例: 活動の予定を見る)
  action: string;
  // 別のサイトを開くリンクかどうか(新しいタブで開く)
  external: boolean;
  // アイコンの形(24×24 の SVG の path)。文字の色で塗る
  icon?: string;
  // 公式のロゴのファイル(public/ からの場所)。形も色も変えずに、そのまま表示する
  image?: string;
}

const icons = {
  // Simple Icons(CC0)の Discord
  discord:
    "M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z",
};

// 入部フォーム(Microsoft Forms)の URL。書く場所は src/content/site/links.yaml の joinForm の一か所だけ
// (編集画面の「サイトの設定 → 入部フォーム・連絡先とリンク」)。
// ヘッダー・トップの上部・目次・入部の章の「入部はこちら」ボタンと、フッターのリンクは、すべてここから行き先を受け取る。空の間は ""
export async function getJoinFormUrl(): Promise<string> {
  const site = await getEntry("site", "links");
  return site?.data.joinForm ?? "";
}

export async function getSiteLinks(): Promise<SiteLink[]> {
  const site = await getEntry("site", "links");
  if (!site) throw new Error("src/content/site/links.yaml が見つかりません");
  const { discord, timetree } = site.data;
  return [
    { name: "Discord", href: discord, action: "Discordで話を聞く", external: true, icon: icons.discord },
    // TimeTree のブランドキット(https://timetreeapp.com/intl/ja/brand-kit)のシンボル。
    // 形・色・スタイルを変えず、枠線などの効果や他の図形と組み合わせずに使う決まり(docs/image-credits.md)
    {
      name: "TimeTree",
      href: timetree,
      action: "活動の予定を見る(TimeTree)",
      external: true,
      image: "/uploads/brand/timetree-symbol.svg",
    },
  ];
}

// 問い合わせ用のメールアドレス(ビルド用の環境変数 CONTACT_EMAIL)。空の間は ""。
// 公開リポジトリに書くと、アドレスを集めるボットに拾われるので、Cloudflare の設定に置いている(docs/production-setup.md)。
// 形がおかしいときや、大学の個人用アドレス(英字の後に数字が続く、学籍番号の形)のときは、ビルドを止めて知らせる
export function getContactEmail(): string {
  const email = (CONTACT_EMAIL ?? "").trim();
  if (!email) return "";
  if (!/^[\w.+-]+@[\w-]+(\.[\w-]+)+$/.test(email)) {
    throw new Error(`環境変数 CONTACT_EMAIL がメールアドレスの形になっていません: ${email}`);
  }
  if (/^[a-z]{1,4}\d{5,}@([\w-]+\.)*oka-pu\.ac\.jp$/i.test(email)) {
    throw new Error(
      "環境変数 CONTACT_EMAIL に大学の個人用アドレスは使えません。団体で共有しているアドレスにしてください",
    );
  }
  return email;
}
