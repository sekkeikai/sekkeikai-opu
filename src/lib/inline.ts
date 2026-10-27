// 文章の中に書ける、ごく簡単な書式を読み取る。
//   [[modeling]]          … 設計を知るページ(/design/modeling/)へのリンク。表示はページの名前
//   [[modeling|モデル]]   … 表示する文字を変えたリンク
//   [[process#loop|工程の行き来]] … ページの中の章へのリンク(# の後ろは章の id)
//   **大事なこと**        … 強調
//   [出典の名前](https://…) … 他のサイトへのリンク(出典を示すときに使う。https:// で始まるものだけ)
// HTML は書けない(そのまま文字として表示される)ので、編集画面から入力しても安全。
export type InlineToken =
  | { kind: "text"; value: string }
  | { kind: "strong"; value: string }
  | { kind: "element"; slug: string; anchor?: string; label?: string }
  | { kind: "link"; label: string; href: string };

const PATTERN =
  /\[\[([a-z0-9-]+)(?:#([a-z0-9-]+))?(?:\|([^\]]+))?\]\]|\*\*([^*]+)\*\*|\[([^\[\]]+)\]\((https:\/\/[^\s)]+)\)/g;

export function parseInline(source: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let last = 0;
  for (const match of source.matchAll(PATTERN)) {
    const index = match.index ?? 0;
    if (index > last) tokens.push({ kind: "text", value: source.slice(last, index) });
    if (match[1]) tokens.push({ kind: "element", slug: match[1], anchor: match[2], label: match[3] });
    else if (match[4]) tokens.push({ kind: "strong", value: match[4] });
    else tokens.push({ kind: "link", label: match[5], href: match[6] });
    last = index + match[0].length;
  }
  if (last < source.length) tokens.push({ kind: "text", value: source.slice(last) });
  return tokens;
}

// 文章の中に、他のサイトへのリンク(出典)が一つ以上あるか。出典の書き忘れを見つけるのに使う
export const hasExternalLink = (source: string) => parseInline(source).some((t) => t.kind === "link");
// 画面に表示される文字の数(リンクの URL や ** は数えない)。注の文字数の上限に使う
// (URL まで数えると、DOI の長いリンクだけで上限を使い切ってしまうため)
export const visibleLength = (source: string) =>
  parseInline(source).reduce((sum, t) => {
    if (t.kind === "link") return sum + [...t.label].length;
    if (t.kind === "element") return sum + [...(t.label ?? t.slug)].length;
    return sum + [...t.value].length;
  }, 0);
// 出典のリンクか、このサイトの他のページへのリンク([[…]])が一つ以上あるか。注に使う
// (出典ではなく「詳しくはこのページへ」という案内だけの注もあるため)
export const hasAnyLink = (source: string) =>
  parseInline(source).some((t) => t.kind === "link" || t.kind === "element");
