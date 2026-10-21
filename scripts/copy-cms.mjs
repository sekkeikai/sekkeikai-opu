// Sveltia CMS 本体を node_modules から public/admin/cms/ にコピーする（dev / build の前に自動実行）。
// バージョンは package.json の @sveltia/cms で管理する。
// （本体はサイトから配信するが、編集画面の日本語訳などは実行時に unpkg.com から読み込まれる）
import { cpSync, rmSync } from "node:fs";

const from = new URL("../node_modules/@sveltia/cms/dist/", import.meta.url);
const to = new URL("../public/admin/cms/", import.meta.url);

rmSync(to, { recursive: true, force: true });
cpSync(from, to, { recursive: true, filter: (src) => !src.endsWith(".map") });
console.log("copied Sveltia CMS → public/admin/cms/");
