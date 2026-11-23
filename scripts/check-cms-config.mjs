// public/admin/config.yml を Sveltia CMS 公式の JSON スキーマで検証する（CI でも実行）。
// 書き間違い（存在しないオプション名・型の間違い）を、編集画面を開く前に見つけるため。
// あわせて、図の選択肢が src/lib/figures.ts の図の一覧と揃っているかと、
// 編集画面から公開した URL や構成を変えられないようになっているかも確かめる。
import { readFileSync } from "node:fs";
import { parse } from "yaml";
import Ajv from "ajv";

const schema = JSON.parse(
  readFileSync(new URL("../node_modules/@sveltia/cms/schema/sveltia-cms.json", import.meta.url), "utf8"),
);
const config = parse(readFileSync(new URL("../public/admin/config.yml", import.meta.url), "utf8"));

const ajv = new Ajv({ allErrors: true, strict: false, validateFormats: false });
const validate = ajv.compile(schema);

if (!validate(config)) {
  console.error("public/admin/config.yml にエラーがあります:");
  for (const err of validate.errors ?? []) console.error(`  ${err.instancePath || "/"} ${err.message}`);
  process.exit(1);
}

// 図（ブロックの type: figure）の選択肢は、src/lib/figures.ts の figureNames と同じにする。
// 図を足したのに編集画面で選べない、ということが起きないようにするため。
const figuresTs = readFileSync(new URL("../src/lib/figures.ts", import.meta.url), "utf8");
const figureNames = [...figuresTs.slice(figuresTs.indexOf("figureNames")).matchAll(/"([a-z0-9-]+)"/g)].map((m) => m[1]);
const design = config.collections.find((c) => c.name === "design");
const blocks = design.fields.find((f) => f.name === "chapters").fields.find((f) => f.name === "blocks");
const options = blocks.types.find((t) => t.name === "figure").fields.find((f) => f.name === "name").options;
if (JSON.stringify(options) !== JSON.stringify(figureNames)) {
  console.error("public/admin/config.yml の図の選択肢が src/lib/figures.ts の figureNames と揃っていません:");
  console.error(`  config.yml にだけある: ${options.filter((n) => !figureNames.includes(n)).join(", ") || "なし"}`);
  console.error(`  figures.ts にだけある: ${figureNames.filter((n) => !options.includes(n)).join(", ") || "なし"}`);
  process.exit(1);
}

const problems = [];

// 「設計を知る」はファイル名が URL。slug の editable が true か "update" だと、
// 保存済みのページの名前（＝公開した URL）を編集画面から変えられてしまう（AGENTS.md「公開した URL は変えない」）
const slugEditable = typeof design.slug === "object" ? design.slug.editable : undefined;
if (slugEditable === true || slugEditable === "update") {
  problems.push("「設計を知る」の slug.editable は false にする（公開したページの URL を変えられないように）");
}

// 編集画面は「運用の窓口」で、構成（ページ・セクション・章・ブロックの数と並び）はコードで変える（config.yml の冒頭）。
// うっかり外さないように、構成に関わる設定がそのままかを確かめる。窓口の範囲を広げるなら、ここも一緒に直す
if (design.create !== false || design.delete !== false) {
  problems.push("「設計を知る」は create: false と delete: false にする（新しいページはコードで作る）");
}
const home = config.collections.find((c) => c.name === "pages").files.find((f) => f.name === "home");
const lockedLists = {
  トップページのセクション: home.fields.find((f) => f.name === "sections"),
  "「設計を知る」の章": design.fields.find((f) => f.name === "chapters"),
  "ブロック（トップページの章と「設計を知る」で共通）": blocks,
  "「設計を知る」の工程ごとの使い方": design.fields.find((f) => f.name === "perStep"),
};
for (const [label, list] of Object.entries(lockedLists)) {
  const open = ["allow_add", "allow_remove", "allow_reorder", "allow_duplicate"].filter((k) => list[k] !== false);
  if (open.length > 0) problems.push(`${label} の ${open.join("・")} を false にする`);
}

if (problems.length > 0) {
  console.error("public/admin/config.yml の設定が、編集画面の決まりに合っていません:");
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

console.log("public/admin/config.yml is valid");
