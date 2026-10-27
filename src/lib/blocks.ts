// 長文の「ブロック」(段落・図・手順・年表など)に、注と図の通し番号を付ける。
// 番号はページ全体で 1, 2, 3… と続くので、章をまたいで数える。
import type { Block } from "../content.config";

export interface NumberedBlock {
  block: Block;
  note?: number;
  figure?: number;
}

export function numberChapters<T extends { blocks: Block[] }>(chapters: T[]): (T & { numbered: NumberedBlock[] })[] {
  let note = 0;
  let figure = 0;
  return chapters.map((chapter) => ({
    ...chapter,
    numbered: chapter.blocks.map((block) => ({
      block,
      note: block.type === "p" && block.note ? ++note : undefined,
      figure: block.type === "figure" || block.type === "idef0" ? ++figure : undefined,
    })),
  }));
}
