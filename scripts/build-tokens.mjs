// tokens/tokens.json（正本）から src/styles/tokens.css を生成する（dev / build の前に自動実行）。
// tokens.css は生成物なので Git には入れない。Figma 側は Tokens Studio が tokens.json を直接 Pull / Push する。
import { readFileSync, writeFileSync } from "node:fs";

const SRC = new URL("../tokens/tokens.json", import.meta.url);
const OUT = new URL("../src/styles/tokens.css", import.meta.url);

// Tailwind v4 の名前空間に合わせる（color → --color-*, font → --font-* など）
const NAMESPACE = { color: "color", font: "font", radius: "radius", motion: "motion" };

function toCss(token) {
  const v = token.$value;
  if (token.$type === "cubicBezier" && Array.isArray(v)) return `cubic-bezier(${v.join(", ")})`;
  // DTCG 2025.10 のオブジェクト形式（{ value, unit }）にも対応
  if (v && typeof v === "object" && "value" in v && "unit" in v) return `${v.value}${v.unit}`;
  if (v && typeof v === "object" && "hex" in v) return v.hex;
  return String(v);
}

function walk(node, path, out) {
  for (const [key, child] of Object.entries(node)) {
    if (key.startsWith("$")) continue;
    if (child && typeof child === "object" && "$value" in child) {
      out.push({ path: [...path, key], token: child });
    } else if (child && typeof child === "object") {
      walk(child, [...path, key], out);
    }
  }
  return out;
}

// 型ごとに値の形をざっくり確かめる（Figma から想定外の値が来たらビルドを止める）
const VALID = {
  color: /^(#[0-9a-f]{3,8}|(rgb|rgba|hsl|hsla|oklch|oklab)\(.+\))$/i,
  dimension: /^-?\d+(\.\d+)?(px|rem|em|%)$/,
  duration: /^\d+(\.\d+)?(ms|s)$/,
};

const tokens = JSON.parse(readFileSync(SRC, "utf8"));
const lines = [];
const errors = [];
for (const [group, ns] of Object.entries(NAMESPACE)) {
  if (!tokens[group]) continue;
  for (const { path, token } of walk(tokens[group], [], [])) {
    const name = `${group}.${path.join(".")}`;
    if (!/^[a-z0-9-]+$/i.test(path.join("-"))) errors.push(`${name}: 名前は英数字とハイフンだけにしてください`);
    const re = VALID[token.$type];
    if (re && !re.test(toCss(token)))
      errors.push(`${name}: ${token.$type} として読めない値です（${JSON.stringify(token.$value)}）`);
    const comment = token.$description ? ` /* ${token.$description.replaceAll("*/", "")} */` : "";
    lines.push(`  --${ns}-${path.join("-")}: ${toCss(token)};${comment}`);
  }
}

// サイトが前提にしているトークン（消えると見た目が壊れる）
const REQUIRED = [
  "color-ink",
  "color-paper",
  "color-muted",
  "color-grid",
  "color-accent",
  "color-accent-strong",
  "color-positive",
  "color-link",
  "font-sans",
  "font-display",
];
for (const name of REQUIRED) {
  if (!lines.some((line) => line.startsWith(`  --${name}:`)))
    errors.push(`${name.replace("-", ".")} がありません（消さないでください）`);
}
if (lines.length === 0)
  errors.push(
    "トークンが 1 つも読めませんでした。Tokens Studio の設定で W3C DTCG 形式（$value / $type）になっているか確認してください",
  );

if (errors.length > 0) {
  console.error("tokens/tokens.json にエラーがあります:\n  " + errors.join("\n  "));
  process.exit(1);
}

const css = `/* 自動生成ファイル（Git 管理外）。tokens/tokens.json を編集してください。 */
@theme static {
${lines.join("\n")}
}
`;

writeFileSync(OUT, css);
console.log(`wrote ${lines.length} tokens → src/styles/tokens.css`);
