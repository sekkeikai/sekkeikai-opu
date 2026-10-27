// 文章（src/content/ の YAML）が、書き方の決まり（docs/writing-guide.md）を守っているかを確かめる。
// 人の記憶だけに頼らず、機械で見つけられる決まりはここで見つける。見つかったら、場所を出して失敗する。
//   - 表記：Web → ウェブ、スマホ → スマートフォン、使い手 → 使う人、要求定義 → 要件定義、長音（コンピューター など）
//   - 表記：全角の記号（（）：？など）→ 半角、ひらがなの語（わかる・よい・いちばん など）→ 漢字
//   - 数を数える漢数字（二つ・三人…）→ 算用数字（2つ・3人…）
//   - 読み方の指示（「読み飛ばしてよい」「3分で読める」など）
//   - 二重否定の決まった形（「ないことはない」など）
//   - 一段落（YAML の 1 行）に強調（**…**）が2か所以上
//   - 架空の例（事例のページと、説明のための場面の例）が、起きていない出来事を過去の形で語っている
//   - 同じ出典の実例が、2つ以上のページにある（同じ実例は1ページにだけ置く）
//   - public/uploads/ の画像が docs/image-credits.md に載っていない
// 参考文献（references:）とリンクの表示名（[…](https://…)）は、作品の名前なのでそのまま使う（調べない）。
// 使い方: npm run check:content
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const files = [
  ...readdirSync("src/content/design").map((f) => join("src/content/design", f)),
  ...readdirSync("src/content/pages").map((f) => join("src/content/pages", f)),
].filter((f) => f.endsWith(".yaml"));

// [表記の決まり, 見つける正規表現, 直し方]
const rules = [
  [/Web/, "「Web」は「ウェブ」と書く"],
  [/スマホ/, "「スマホ」は「スマートフォン」と書く"],
  [/使い手/, "「使い手」は「使う人」「利用者」と書く"],
  [/要求定義/, "「要求定義」は「要件定義」と書く"],
  [
    /(コンピュータ|プリンタ|パラメータ|ライブラリ|ユーザ(?!ビリティ))(?!ー)/,
    "外来語の語末の長音「ー」を付ける（コンピューター など）",
  ],
  [/(?<![一二三四五六七八九十百千第])[二三四五六七八九](つ|人|件|か所)/, "数を数えるときは算用数字で書く（2つ、3人）"],
  [/読み飛ば|分で読め|読まなくても/, "読み方の指示は書かない（拾い読みしやすさは見た目と構成でつくる）"],
  [/ないことはない|なくはない|ないわけではない|なくもない/, "二重否定は使わない"],
  [/[（）：？！〜＋－／＝]/, "記号は半角で書く（( ) : ? ! ~ + - / =）。書名『…』と出典の題名は原文のまま"],
  [
    /わか[るりっられ]|(?<![てでば])よい|いちばん|すべて|たとえば|まったく|すき間|子ども|しかた|くわし|ひとこと|裏づけ|引っぱ|(?<=[のがはをもに、「(])めやす|見きわめ|一つ一つ/,
    "漢字で書く（分かる・良い・一番・全て・例えば・全く・隙間・子供・仕方・詳しく・一言・裏付け・引っ張る・目安・見極め・一つひとつ）",
  ],
];

const problems = [];
const sources = new Map(); // 実例の出典の URL → それを使っているファイル
const images = [];

// 架空の例は「これからこう進める」という計画の形で書く。起きていない出来事を過去の形で書かない（存在しない過去の話には価値がない）。
// 調べるのは、事例（layer: case）のページの本文と、説明のための場面の例（kind: real でない example）。
// 「〜だったら」のような仮定は調べない。
const pastTense = /ました|でした|だった(?!ら)|ていた/;
const ownText = /^\s+(?:- )?(?:text|point|caption|heading|lead|summary|title|answer):\s*(.*)$/;

for (const file of files) {
  const content = readFileSync(file, "utf8");
  const lines = content.split("\n");
  const isCase = /^layer: case\s*$/m.test(content);
  let inReferences = false;
  // 読んでいる途中の example ブロック（kind は text の後ろに書かれることもあるので、ブロックの終わりで判断する）
  let example = null;
  // 実際にあった例（kind: real）は過去の出来事なので、事例のページの中でも調べない
  const flushExample = () => {
    if (example && !example.real) {
      for (const [where, text] of example.texts) {
        const m = text.match(pastTense);
        if (m) problems.push(`${where}: 架空の例は、計画の形（〜します、〜なら）で書く（「${m[0]}」）`);
      }
    }
    example = null;
  };
  lines.forEach((raw, i) => {
    if (/^\S/.test(raw)) inReferences = /^references:/.test(raw);
    if (inReferences || /^\s*#/.test(raw)) return;
    const where = `${file}:${i + 1}`;
    const block = raw.match(/^(\s*)- (?:type|id):\s*(\S+)/);
    if (block) {
      flushExample();
      if (block[2] === "example") example = { real: false, texts: [] };
    }
    const own = raw.match(ownText);
    if (example) {
      if (/^\s+kind:\s*real\s*$/.test(raw)) example.real = true;
      if (own) example.texts.push([where, own[1]]);
    }
    // example の中の行は、ブロックの終わり（flushExample）でまとめて調べる
    if (isCase && own && !example) {
      const m = own[1].match(pastTense);
      if (m) problems.push(`${where}: 事例のページは、これから進める計画の形（〜します、〜なら）で書く（「${m[0]}」）`);
    }
    // リンクの表示名と URL は調べない（作品や記事の名前は原文のまま）
    // 書名『…』も原文のまま（「誰のためのデザイン？」の全角の？など）なので調べない
    const text = raw
      .replace(/\[[^\[\]]*\]\(https:\/\/[^\s)]+\)/g, "")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/『[^』]*』/g, "");
    for (const [re, message] of rules) {
      const m = text.match(re);
      if (m) problems.push(`${where}: ${message}（「${m[0]}」）`);
    }
    if ((raw.match(/\*\*[^*]+\*\*/g) ?? []).length > 1) problems.push(`${where}: 強調（**…**）は一段落に1か所まで`);
    const source = raw.match(/^\s+source:\s*(.*)$/);
    if (source) {
      for (const [, url] of source[1].matchAll(/\]\((https:\/\/[^\s)]+)\)/g)) {
        if (!sources.has(url)) sources.set(url, new Set());
        sources.get(url).add(file);
      }
    }
    const image = raw.match(/^\s+src:\s*["']?(\/uploads\/\S+?)["']?\s*$/);
    if (image) images.push([where, image[1]]);
  });
  flushExample();
}

for (const [url, where] of sources) {
  if (where.size > 1) {
    problems.push(
      `同じ出典の実例が ${where.size} ページにあります（1ページにだけ置き、ほかはリンクにする）: ${url}\n      ${[...where].join(", ")}`,
    );
  }
}

const credits = readFileSync("docs/image-credits.md", "utf8");
for (const [where, src] of images) {
  if (!credits.includes(`public${src}`))
    problems.push(`${where}: 画像 ${src} を docs/image-credits.md に書いてください`);
}

if (problems.length > 0) {
  console.error(
    `書き方の決まりに合わないところが ${problems.length} か所あります（docs/writing-guide.md）:\n` +
      problems.map((p) => "  - " + p).join("\n"),
  );
  process.exit(1);
}
console.log("文章は、書き方の決まりに合っています。");
