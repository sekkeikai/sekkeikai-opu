// public/admin/config.yml を Sveltia CMS 公式の JSON スキーマで検証する（CI でも実行）。
// 書き間違い（存在しないオプション名・型の間違い）を、編集画面を開く前に見つけるため。
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
console.log("public/admin/config.yml is valid");
