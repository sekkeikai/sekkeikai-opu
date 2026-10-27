import { defineCollection, reference } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { figureNames } from "./lib/figures";
import { hasAnyLink, hasExternalLink, visibleLength } from "./lib/inline";

// エラーメッセージを日本語にする(CI のログで読めるように)
z.config(z.locales.ja());

// 文章(src/content/)の値をここで検証する。編集画面(CMS)から入力された値もここで検証される。
// 文字数の上限などを変えたら、public/admin/config.yml の同じ入力欄の maxlength なども同じ値にする。
// 文字数の上限などを超えるとビルドが失敗するので、デザインが崩れたまま公開されることはない。
// 文章の書き方の決まりは docs/writing-guide.md にまとめている。

const news = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/news" }),
  schema: z
    .object({
      title: z.string().max(60),
      date: z.coerce.date(),
      summary: z.string().max(140).optional(),
      cover: z.string().optional(),
      coverAlt: z.string().max(100).optional(),
      draft: z.boolean().default(false),
    })
    // 画像には、画像の中身を伝える説明(alt)が要る。cover を書いたら coverAlt も書く
    .refine((n) => !n.cover || n.coverAlt, {
      message: "cover(画像)を書いたら coverAlt(画像の説明)も書いてください",
      path: ["coverAlt"],
    }),
});

// ── 関連授業 ──
// 岡山県立大学のシラバスにある授業。授業名はシラバスの表記通りに書き、担当教員の名前は書かない(年度ごとに変わるため)。
// path はシラバスのページの場所(例: 0222/0222_22147401)。年度は src/lib/syllabus.ts で一か所にまとめている
const course = z.object({
  name: z.string().max(40),
  // 学科名(例: 人間情報工学科)。全学共通の授業は「共通教育」
  dept: z.string().max(24),
  // このページとのつながりを一言で
  relation: z.string().max(80),
  path: z
    .string()
    .regex(/^\d{2,4}\/\d{2,4}_[0-9A-Z]{8}$/, { message: "path は 0222/0222_22147401 の形で書いてください" })
    .optional(),
});

// ── ブロック ──
// 長文は「ブロック」を上から並べて書く。トップページの章と「設計を知る」のページで同じブロックが使える。
// 文章の中には [[modeling]](ページへのリンク)、[[process#loop|工程の行き来]](章へのリンク)、
// **強調** が書ける(src/lib/inline.ts)。表示は src/components/Blocks.astro。
const block = z.discriminatedUnion("type", [
  // 段落。note は本文の右(スマホでは段落の下)に出る短い注。出典や一言の補足を書く。
  // 注には出典のリンク [表示名](https://…) を必ず書く(URL のない出典は使わない)。
  // 出典ではなく、このサイトの他のページへの案内だけの注なら [[…]] のリンクでも良い。
  // 文字数の上限(300字)は、画面に出る文字だけを数える(URL は数えない)。max(1000) は URL も含めた入力全体の上限
  z.object({
    type: z.literal("p"),
    text: z.string().max(600),
    note: z
      .string()
      .max(1000)
      .refine(hasAnyLink, { message: "注には出典のリンク [表示名](https://…) を書いてください" })
      .refine((s) => visibleLength(s) <= 300, { message: "注は、表示される文字で300字以内にしてください" })
      .optional(),
  }),
  // 章の中の小見出し。見出しだけ拾い読みしても話が分かるように、主張の形で書く
  z.object({ type: z.literal("heading"), text: z.string().max(40) }),
  // 要点。その部分で一番言いたいことを一、二文で。見た目で目立たせるので、ここだけ拾い読みしても筋が通るように書く
  z.object({ type: z.literal("point"), text: z.string().max(160) }),
  // 読者への問いかけ。答え(answer)は隠さず、すぐ下に出す(折りたたみは読み飛ばされやすいため)
  z.object({ type: z.literal("question"), text: z.string().max(100), answer: z.string().max(240).optional() }),
  // 例。kind で2種類に分ける(見た目の札も変わる):
  //   real  … 実際にあった例。source(出どころ)にリンクを必ず書く。札は「実際にあった例」
  //   scene … 説明のための場面(部室の予約など)。省略するとこちら。札は「例えば」。架空なら題か lead にそう書き、「~なら、こうする」の計画の形で書く
  // source の文字数の上限(200字)は、画面に出る文字だけを数える(URL は数えない)
  z
    .object({
      type: z.literal("example"),
      kind: z.enum(["real", "scene"]).default("scene"),
      title: z.string().max(30).optional(),
      text: z.string().max(400),
      source: z
        .string()
        .max(800)
        .refine(hasExternalLink, { message: "例の出典には [表示名](https://…) の形でリンクを書いてください" })
        .refine((s) => visibleLength(s) <= 200, { message: "例の出典は、表示される文字で200字以内にしてください" })
        .optional(),
    })
    .refine((b) => b.kind !== "real" || b.source, {
      message: "実際にあった例(kind: real)には source に出典のリンクを書いてください",
      path: ["source"],
    }),
  // 折りたたみの補足。本題ではないが分量の多い補足や、詳しい事例を入れる。
  // 短い補足や出典は、折りたたみではなく段落の note(本文の右)に書く
  z.object({
    type: z.literal("aside"),
    title: z.string().max(40),
    body: z.array(z.string().max(500)).min(1).max(6),
  }),
  // 箇条書き
  z.object({ type: z.literal("list"), items: z.array(z.string().max(160)).min(1).max(8) }),
  z.object({ type: z.literal("figure"), name: z.enum(figureNames) }),
  // IDEF0(機能の図)。function の箱に、左から入力・上から制御・下から機構が入り、右へ出力が出る。
  // steps を書くと、機能を細かく分けた図(分解図)も描く(前の機能の出力が、次の機能の入力になる)
  z.object({
    type: z.literal("idef0"),
    title: z.string().max(40),
    caption: z.string().max(200).optional(),
    function: z.string().max(24),
    inputs: z.array(z.string().max(14)).min(1).max(3),
    controls: z.array(z.string().max(14)).max(3).default([]),
    outputs: z.array(z.string().max(14)).min(1).max(3),
    mechanisms: z.array(z.string().max(14)).max(3).default([]),
    steps: z
      .array(z.object({ name: z.string().max(16), output: z.string().max(14) }))
      .min(2)
      .max(4)
      .optional(),
  }),
  // 外部の画像。著作権を必ず確認し、パブリックドメインか再利用が許されたライセンスの画像だけを使う。
  // 画像は public/uploads/ に置き、credit(作者・出典)と license を必ず書く。
  // sourceUrl は画像の元のページ。CC BY などのライセンスでは、licenseUrl(ライセンスの本文へのリンク)も書く。
  // 画像を足したら docs/image-credits.md にも書く(npm run check:content で突き合わせる)
  z
    .object({
      type: z.literal("image"),
      src: z.string(),
      alt: z.string().max(160),
      caption: z.string().max(200),
      credit: z.string().max(160),
      license: z.string().max(60),
      licenseUrl: z.url().optional(),
      sourceUrl: z.url(),
    })
    .refine((b) => !/^CC BY/i.test(b.license) || b.licenseUrl, {
      message: "CC BY 系のライセンスの画像には licenseUrl(ライセンスの本文へのリンク)を書いてください",
      path: ["licenseUrl"],
    }),
  // 表(要件の一覧や、案の比べ方など)。head は見出しの行、rows は本文の行
  z.object({
    type: z.literal("table"),
    caption: z.string().max(80),
    head: z.array(z.string().max(30)).min(2).max(6),
    rows: z
      .array(z.array(z.string().max(80)).min(2).max(6))
      .min(1)
      .max(12),
  }),
  z.object({
    type: z.literal("steps"),
    // true … 順番のある手順(手順 1, 2…と番号が付く)/ false … 順番の無い手法の一覧(番号なし)
    ordered: z.boolean().default(true),
    items: z
      .array(z.object({ title: z.string().max(30), body: z.string().max(240) }))
      .min(1)
      .max(8),
  }),
  z.object({
    type: z.literal("timeline"),
    items: z
      .array(z.object({ year: z.string().max(14), title: z.string().max(40), body: z.string().max(200) }))
      .min(1)
      .max(16),
  }),
  // 左右の対比(「単純な思いつき」→「よく考えられた設計」など)
  z.object({
    type: z.literal("compare"),
    fromLabel: z.string().max(20),
    toLabel: z.string().max(20),
    rows: z
      .array(z.object({ from: z.string().max(20), to: z.string().max(20) }))
      .min(1)
      .max(6),
  }),
  // 言葉を札にして並べる
  z.object({
    type: z.literal("tags"),
    label: z.string().max(30).optional(),
    items: z.array(z.string().max(12)).min(1).max(20),
  }),
  // 見出し+本文のカード
  z.object({
    type: z.literal("cards"),
    items: z
      .array(z.object({ title: z.string().max(20), body: z.string().max(160), note: z.string().max(60).optional() }))
      .min(1)
      .max(6),
  }),
  // 設計の地図(工程 × 視点)。中身は src/content/design/ から自動で作る。新しい視点のページを足すと、ここにも出る
  z.object({ type: z.literal("map"), variant: z.enum(["compact", "full"]).default("compact") }),
  // 視点(lens)のページで、その視点を工程ごとにどう使うか(ページの perStep から作る)
  z.object({ type: z.literal("per-step") }),
  // 岡山県立大学の関連授業(トップページの章などで使う)。1か所に5件まで
  z.object({ type: z.literal("courses"), items: z.array(course).min(1).max(5) }),
  // 他のページへの「詳しく読む」リンク
  z.object({ type: z.literal("link"), label: z.string().max(40), href: z.string() }),
]);

export type Block = z.infer<typeof block>;

// ── トップページ ──
// 章(chapter)を上から並べた長文。先頭の summary は、各章の見出しと要点から自動で作る全体の見取り図。
const section = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("hero"),
    eyebrow: z.string().max(60).optional(),
    title: z.string().max(30),
    lead: z.string().max(160),
    // ボタンは「入部はこちら」だけで、文言は決まっている(src/components/JoinButton.astro)ので、ここには書かない。行き先は site の joinForm
  }),
  // 全体の見取り図。後ろに続く章の見出しと要点を並べる(中身は自動)
  z.object({ type: z.literal("summary"), title: z.string().max(30), lead: z.string().max(120).optional() }),
  // 長文の章。見出し(title)は主張、eyebrow は読者の問い、point はこの章の要点(まとめにも出る)
  z.object({
    type: z.literal("chapter"),
    // 章へのリンク用の名前(例: why-now → /#why-now)。英小文字とハイフン
    id: z.string().regex(/^[a-z0-9-]+$/, { message: "id は英小文字・数字・ハイフンで書いてください" }),
    eyebrow: z.string().max(30),
    title: z.string().max(30),
    point: z.string().max(120),
    blocks: z.array(block).min(1).max(30),
  }),
  z.object({
    type: z.literal("join"),
    eyebrow: z.string().max(20).optional(),
    title: z.string().max(30),
    body: z.string().max(200),
    // traits の上に出す小見出し(例: 設計会で身に付く力)
    traitsTitle: z.string().max(20).optional(),
    traits: z
      .array(z.object({ title: z.string().max(10), body: z.string().max(40) }))
      .max(4)
      .default([]),
  }),
  z.object({
    type: z.literal("info"),
    title: z.string().max(40),
    items: z
      .array(z.object({ label: z.string().max(12), value: z.string().max(60) }))
      .min(1)
      .max(10),
  }),
  z.object({
    type: z.literal("news"),
    title: z.string().max(40),
    limit: z.number().int().min(1).max(6).default(3),
  }),
]);

export type Section = z.infer<typeof section>;

const pages = defineCollection({
  loader: glob({ pattern: "**/*.yaml", base: "./src/content/pages" }),
  schema: z.object({
    title: z.string().max(40),
    description: z.string().max(160),
    sections: z.array(section).min(1),
  }),
});

// ── 「設計を知る」のページ(/design/〇〇/) ──
// ファイル名がそのまま URL になる(例: modeling.yaml → /design/modeling/)。ファイルを足せばページが増える。
// 1ページ1テーマにする(トップページだけは例外で、概要から興味をもつまでを1ページで担う)。長くなったら、ページを分ける。
// layer で階層を分ける(混ぜない):
//   process … 設計のプロセスの全体像(1 ページだけ)
//   step    … 工程 1 つにつき 1 ページ。order が工程の順番。stepName に正式な呼び名(例: 要件定義)を書く。地図の列になる
//   lens    … どの工程にも通じる視点(モデル化・ヒューマンインターフェース・データ分析…)。地図の行になる
//   case    … 設計の流れの例(イベント、ロボットなど)。決まった型で書かず、実際の手順を順に並べる(5つの工程に合わせなくてよい)。
//             これから取り組む計画として「~します」「~なら」で書く(起きていない出来事を過去の形で書かない)。
//             手順を行った結果(選んだ案、決めた数値など)は書かない。グループや状況で違ってよいので、手順のやり方と、できるものの形までを書く。
//             章の手順が1つの工程にはっきり入るときだけ、step に工程の番号を書く
//   topic   … それ以外のテーマ(一覧の「その他のテーマ」に出る)
// 章の並びや中身は決めていない。そのテーマが一番伝わる組み立てで書く。
const design = defineCollection({
  loader: glob({ pattern: "**/*.yaml", base: "./src/content/design" }),
  schema: z
    .object({
      title: z.string().max(24),
      en: z.string().max(30),
      layer: z.enum(["process", "step", "lens", "case", "topic"]),
      // 並べる順番(同じ layer の中で)。工程(step)では、これが工程の番号になる
      order: z.number().int().min(1),
      // 短い言い方(例: モデルで考える)。地図の行の見出しや一覧のカードに出る
      short: z.string().max(14),
      // 工程(step)のページだけ: 正式な呼び名(例: 要件定義)
      stepName: z.string().max(10).optional(),
      // 工程(step)のページだけ: 考えを広げる工程か(diverge)、絞る工程か(converge)。全体図の色分けに使う
      mode: z.enum(["diverge", "converge"]).optional(),
      // 工程(step)のページだけ: 代表的な手法(全体図に出す。例: 観察・インタビュー・KJ法)
      tools: z.string().max(24).optional(),
      question: z.string().max(40),
      summary: z.string().max(120),
      lead: z.string().max(300),
      chapters: z
        .array(
          z.object({
            // 章へのリンク用の名前(省略すると ch-1, ch-2…)
            id: z
              .string()
              .regex(/^[a-z0-9-]+$/)
              .optional(),
            // 見出しの上の小さなラベル(省略可)
            label: z.string().max(20).optional(),
            heading: z.string().max(40),
            // 事例(case)のページだけ: この章がどの工程の話か(工程の番号)。ラベルと工程のページへのリンクが付く
            step: z.number().int().min(1).optional(),
            blocks: z.array(block).min(1).max(30),
          }),
        )
        .min(1)
        .max(16),
      references: z
        // 参考文献には必ず URL を書く(URL のない出典は使わない)
        .array(z.object({ text: z.string().max(240), url: z.url() }))
        .max(30)
        .default([]),
      // 岡山県立大学の関連授業(補足)。ページの終わりに小さな枠で出す
      courses: z.array(course).max(5).default([]),
      related: z.array(reference("design")).max(4).default([]),
      // 視点(lens)のページ: 各工程で、この視点をどう使うか(工程の順に、工程の数だけ書く)。
      // cell は地図の表のマスに、body は「工程ごとの使い方」(ブロック type: per-step)に出る。
      // まだ書けていなければ省略してよい(地図では空欄になる)
      perStep: z
        .array(z.object({ cell: z.string().max(24), body: z.string().max(240) }))
        .max(8)
        .optional(),
    })
    .superRefine((page, ctx) => {
      if (page.layer === "step") {
        for (const key of ["stepName", "mode", "tools"] as const) {
          if (!page[key]) {
            ctx.addIssue({
              code: "custom",
              path: [key],
              message: `工程(layer: step)のページには ${key} を書いてください`,
            });
          }
        }
      }
      if (page.layer !== "lens" && page.perStep) {
        ctx.addIssue({
          code: "custom",
          path: ["perStep"],
          message: "perStep は視点(layer: lens)のページだけに書けます",
        });
      }
    }),
});

// サイト全体のリンク(ヘッダーのアイコンなど)
// 編集画面は空の欄をファイルに書かないので、書かれていない項目は空("")として扱う
const site = defineCollection({
  loader: glob({ pattern: "**/*.yaml", base: "./src/content/site" }),
  schema: z.object({
    // 入部フォーム(Microsoft Forms)の URL。ヘッダー・トップの上部・目次・入部の章の「入部はこちら」ボタンと、フッターのリンクは、すべてここを開く。空の間は押せない見た目になる。
    // 共有リンクは forms.office.com の他、新しい forms.cloud.microsoft で出ることもある
    joinForm: z
      .union([
        z.literal(""),
        z
          .url({ message: "入部フォームの URL は https:// から始まる形で入力してください" })
          .refine((u) => /^https:\/\/(forms\.office\.com|forms\.microsoft\.com|forms\.cloud\.microsoft)\//.test(u), {
            message: "入部フォームは Microsoft Forms の URL(https://forms.office.com/…)を入力してください",
          }),
      ])
      .default(""),
    // Discord の招待リンク。空の間は出さない
    discord: z.union([z.literal(""), z.url()]).default(""),
    // TimeTree(活動予定のカレンダー)の共有リンク。空の間は出さない
    timetree: z.union([z.literal(""), z.url()]).default(""),
    // 問い合わせ用のメールアドレス。団体で共有しているアドレスにする(個人や大学の個人用アドレスは書かない)
    // 大学の個人用アドレス(英字の後に数字が続く、学籍番号の形)は入力できないようにしている
    email: z
      .union([
        z.literal(""),
        z
          .email({ message: "メールアドレスの形で書いてください" })
          .refine((m) => !/^[a-z]{1,4}\d{5,}@([\w-]+\.)*oka-pu\.ac\.jp$/i.test(m), {
            message: "大学の個人用アドレスは書けません。団体で共有しているアドレスを書いてください",
          }),
      ])
      .default(""),
  }),
});

export const collections = { news, pages, design, site };
