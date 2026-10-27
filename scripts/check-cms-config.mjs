// public/admin/config.yml を Sveltia CMS 公式の JSON スキーマで検証する（CI でも実行）。
// 書き間違い（存在しないオプション名・型の間違い）を、編集画面を開く前に見つけるため。
// あわせて、図の選択肢が src/lib/figures.ts の図の一覧と揃っているかも確かめる。
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

console.log("public/admin/config.yml is valid");
