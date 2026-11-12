// 「設計を知る」のデータ(src/content/design/)から、工程・視点・事例を取り出す。
// 工程は layer: step のページ(1 工程 1 ページ)。order が工程の番号になる。
// ページ(YAML)を足すだけで、一覧・地図・リンクに自動で加わるようにしている。
import { getCollection } from "astro:content";
import type { CollectionEntry } from "astro:content";

type Layer = CollectionEntry<"design">["data"]["layer"];

export interface ProcessStep {
  // 1 から始まる工程の番号
  n: number;
  // ページの名前(URL の一部)
  id: string;
  href: string;
  title: string;
  sub: string;
  // その工程で考える問い(例: 本当に解くべき問題は何か)
  question: string;
  mode: "diverge" | "converge";
  tools: string;
}

// 指定した layer のページを order の順に
export async function getDesignPages(layer: Layer): Promise<CollectionEntry<"design">[]> {
  return (await getCollection("design", (e) => e.data.layer === layer)).sort((a, b) => a.data.order - b.data.order);
}

export async function getProcessSteps(): Promise<ProcessStep[]> {
  return (await getDesignPages("step")).map((p) => ({
    n: p.data.order,
    id: p.id,
    href: `/design/${p.id}/`,
    title: p.data.title,
    sub: p.data.stepName ?? "",
    question: p.data.question,
    mode: p.data.mode ?? "converge",
    tools: p.data.tools ?? "",
  }));
}

// 視点(lens)のページ。perStep を書いているのに工程の数と合わないときは、ビルドを止めて知らせる
export async function getLenses(): Promise<CollectionEntry<"design">[]> {
  const steps = await getProcessSteps();
  const lenses = await getDesignPages("lens");
  for (const l of lenses) {
    if (l.data.perStep && l.data.perStep.length !== steps.length) {
      throw new Error(
        `src/content/design/${l.id}.yaml の perStep は、工程の数(${steps.length}個)と同じ数だけ書いてください`,
      );
    }
  }
  return lenses;
}

// ── 分野のページ(親のページから広がる分野の紹介。YAML に parent を書いたページ) ──

// 分野のページかどうか
export const isFieldPage = (page: CollectionEntry<"design">): boolean => Boolean(page.data.parent);

// 親のページごとに、その下の分野のページを order の順にまとめる。
// 階層は1段まで。分野のページを親にしていたら、ビルドを止めて知らせる
async function getFieldMap(): Promise<Map<string, CollectionEntry<"design">[]>> {
  const pages = await getCollection("design");
  const byId = new Map(pages.map((p) => [p.id, p]));
  const map = new Map<string, CollectionEntry<"design">[]>();
  for (const page of pages) {
    const parentId = page.data.parent?.id;
    if (!parentId) continue;
    if (byId.get(parentId)?.data.parent) {
      throw new Error(
        `src/content/design/${page.id}.yaml の parent(${parentId})は、それ自身が分野のページです。分野のページの下にページは置けません`,
      );
    }
    map.set(parentId, [...(map.get(parentId) ?? []), page]);
  }
  for (const list of map.values()) list.sort((a, b) => a.data.order - b.data.order);
  return map;
}

// 指定したページの下にある分野のページ(無ければ空)
export async function getFieldPages(parentId: string): Promise<CollectionEntry<"design">[]> {
  return (await getFieldMap()).get(parentId) ?? [];
}

// 読む順に並べた全ページ(前後のページへのリンクに使う)。
// プロセス → 工程 → 視点 → 事例 → テーマの順で、同じ階層の中は order の順。分野のページは、親のページのすぐ後ろに置く
export async function getPagesInReadingOrder(): Promise<CollectionEntry<"design">[]> {
  const rank = { process: 0, step: 1, lens: 2, case: 3, topic: 4 } as const;
  const fields = await getFieldMap();
  const tops = (await getCollection("design", (p) => !isFieldPage(p))).sort((a, b) =>
    a.data.layer === b.data.layer ? a.data.order - b.data.order : rank[a.data.layer] - rank[b.data.layer],
  );
  return tops.flatMap((p) => [p, ...(fields.get(p.id) ?? [])]);
}

// 一覧やリンクのカードに出す、階層の名前
export function layerLabel(page: CollectionEntry<"design">): string {
  if (isFieldPage(page)) return `分野 / ${page.data.en}`;
  switch (page.data.layer) {
    case "process":
      return "設計のプロセス";
    case "step":
      return `工程 ${page.data.order} — ${page.data.stepName}`;
    case "lens":
      return `視点 ${page.data.order} / ${page.data.en}`;
    case "case":
      return `設計の流れの例`;
    default:
      return `テーマ / ${page.data.en}`;
  }
}
