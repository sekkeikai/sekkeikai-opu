// 外部リンク（出典・参考文献・画像の元のページ・図の出典）と、関連授業のシラバスのリンクが開けるかを確かめる。
// ネットにつなぐので時間がかかり、相手のサイトの調子でも結果が変わる。だからビルドには入れず、年度の初めや、
// SYLLABUS_YEAR（src/lib/syllabus.ts）を変えたときに走らせる。
//   - 開けないリンク（404 など）があると失敗する
//   - シラバスは、ページの中に授業名があるかも確かめる（同じ番号が別の授業に変わっていないか）
//   - 403 や 429（機械からの読み込みを断るサイト）は「ブラウザで確かめて」として出すだけにする
// 使い方: npm run check:links
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
  );

// ── 調べる URL を集める ──
const links = new Map(); // URL → 書かれているファイル
const add = (url, file) => {
  const clean = url.replace(/[.,;:]+$/, "");
  if (!links.has(clean)) links.set(clean, new Set());
  links.get(clean).add(file);
};
for (const file of [
  ...walk("src/content"),
  ...walk("src/components/figures"),
  "docs/writing-guide.md",
  "docs/image-credits.md",
]) {
  if (!/\.(ya?ml|astro|md)$/.test(file)) continue;
  // URL に使える文字だけを拾う（かっこや日本語の手前で止める。Wikipedia などのかっこは %28 %29 で書く）
  for (const [url] of readFileSync(file, "utf8").matchAll(/https:\/\/[A-Za-z0-9\-._~:/?#@!$&*+,;=%]+/g)) add(url, file);
}
// 入部フォームなど、まだ空の項目や、例として書いた URL は除く
for (const url of links.keys()) if (/example\.com|forms\.office\.com\/…/.test(url)) links.delete(url);

// ── シラバス ──
const year = readFileSync("src/lib/syllabus.ts", "utf8").match(/SYLLABUS_YEAR = (\d{4})/)[1];
const courses = [];
for (const file of walk("src/content")) {
  if (!file.endsWith(".yaml")) continue;
  const text = readFileSync(file, "utf8");
  for (const m of text.matchAll(/- name: (.+)\n\s+dept: .+\n\s+relation: .+\n\s+path: (\S+)/g)) {
    courses.push({ name: m[1].trim(), url: `https://www.oka-pu.ac.jp/syllabus/${year}/${m[2]}_ja_JP.html`, file });
  }
}

// ── 確かめる（一度に 6 件ずつ） ──
const check = async (url) => {
  try {
    // DOI は、doi.org が出版社のページへ転送（3xx）すれば存在する。出版社のページは機械からの読み込みを断ることが多いので開かない
    if (url.startsWith("https://doi.org/")) {
      const res = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(20000) });
      return { status: res.status >= 300 && res.status < 400 ? 200 : res.status, body: "" };
    }
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(20000),
      headers: { "user-agent": "Mozilla/5.0 (link check for the sekkeikai site)" },
    });
    return { status: res.status, body: res.ok ? await res.text() : "" };
  } catch (error) {
    return { status: 0, body: "", error: error.cause?.code ?? error.name };
  }
};
const queue = [...links.keys()].map((url) => ({ url })).concat(courses.map((c) => ({ ...c, course: true })));
const broken = [];
const manual = [];
let done = 0;
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      const { status, body, error } = await check(item.url);
      done += 1;
      const where = item.course ? item.file : [...links.get(item.url)].join(", ");
      if (status === 403 || status === 429 || status === 0) {
        manual.push(`${item.url}（${status || error}）\n      ${where}`);
      } else if (status >= 400) {
        broken.push(`${item.url}（${status}）\n      ${where}`);
      } else if (item.course && !body.includes(item.name)) {
        broken.push(
          `${item.url}: 授業名「${item.name}」がページにありません（${year}年度に変わった？）\n      ${where}`,
        );
      }
    }
  }),
);

console.log(`${done} 件のリンクを確かめました（シラバス ${courses.length} 件を含む）。`);
if (manual.length > 0) {
  console.log(
    `\n機械からは開けなかったので、ブラウザで確かめてください（${manual.length} 件）:\n` +
      manual.map((m) => "  - " + m).join("\n"),
  );
}
if (broken.length > 0) {
  console.error(`\n開けないリンクがあります（${broken.length} 件）:\n` + broken.map((m) => "  - " + m).join("\n"));
  process.exit(1);
}
