// 図（src/components/figures/）の出典（source="…"）に、リンク [名前](https://…) があるかを確かめる。
// 出典はリンクを付けて書く決まり（docs/writing-guide.md）。リンクのない出典が見つかったら、その図の名前を出して失敗する。
// 使い方: npm run check:sources
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const dir = "src/components/figures";
const missing = [];
for (const file of readdirSync(dir).filter((f) => f.endsWith(".astro"))) {
  const text = readFileSync(join(dir, file), "utf8");
  for (const m of text.matchAll(/\bsource="([^"]*)"/g)) {
    if (!/\]\(https:\/\/[^\s)]+\)/.test(m[1])) missing.push(`${file}: ${m[1]}`);
  }
}
if (missing.length > 0) {
  console.error("出典にリンク（[名前](https://…)）がない図があります:\n" + missing.map((m) => "  - " + m).join("\n"));
  process.exit(1);
}
console.log("図の出典は、すべてリンク付きです。");
