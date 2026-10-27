// 広い画面(1024px 以上)で、本文の右に並べた注(.sidenote)が重ならないように並べ直す(アニメーションではない)。
// 注は、段落のあいだに大きな空白ができないように、CSS で行の高さの計算から外している(global.css の .sidenote)。
// そのため長い注は下へはみ出し、次の注や、図などの幅の広い部品に重なることがある。ここでは:
//   - 前の注に重なる注は、前の注の下まで下げる
//   - 注が図などに重なるときは、その部品の上に余白を足して下げる
// 画面の幅が変わったときや、フォント・画像の読み込みで高さが変わったときにやり直す。
const GAP = 12; // 注と注、注と部品のあいだに空ける幅(px)

// 要素の位置。ふわっと出る動き(motion.ts の data-reveal)の途中は transform で位置がずれているので、その分を除く
function placed(el: HTMLElement): DOMRect {
  const r = el.getBoundingClientRect();
  const t = getComputedStyle(el).transform;
  const dy = t && t !== "none" ? new DOMMatrixReadOnly(t).m42 : 0;
  return new DOMRect(r.x, r.y - dy, r.width, r.height);
}

export function initSidenotes(): void {
  const notes = [...document.querySelectorAll<HTMLElement>(".sidenote")];
  if (notes.length === 0) return;
  const wide = window.matchMedia("(min-width: 1024px)");

  // 注とぶつかるかもしれない部品: 長文(.longform)と、その中の章(section)に並ぶ、段落の行(.longform-row)以外の部品と、
  // 長文の後ろに続く部品。文書の順(上から下)に並べる
  const ordered = [
    ...document.querySelectorAll<HTMLElement>(
      ".longform > :not(section, .longform-row), .longform > section > :not(.longform-row), .longform ~ *",
    ),
  ];
  const added = new Map<HTMLElement, number>(); // 部品に足した上の余白(px)

  const layout = () => {
    notes.forEach((n) => (n.style.transform = ""));
    added.forEach((_, el) => (el.style.marginTop = ""));
    added.clear();
    if (!wide.matches) return;

    let prevBottom = -Infinity;
    for (const note of notes) {
      const row = note.closest<HTMLElement>(".longform-row");
      // 前の注に重なるなら下げる
      const top = note.getBoundingClientRect().top;
      const shift = prevBottom + GAP - top;
      if (shift > 0) note.style.transform = `translateY(${shift}px)`;
      const rect = note.getBoundingClientRect();
      prevBottom = rect.bottom;

      // 注より後ろにあり、注と横に重なる部品が、注の下端より上にあれば、その部品を下げる
      for (const el of ordered) {
        if (!row || !(row.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING)) continue;
        // 段落の行の高さが変わると次の部品が動くので、毎回はかり直す
        let r = placed(el);
        if (r.top >= rect.bottom + GAP) break;
        if (r.height === 0 || r.right <= rect.left || r.left >= rect.right) continue;
        // 余白の打ち消し合い(margin collapsing)で足した分がそのまま効かないことがあるので、足りるまで数回足す
        for (let i = 0; i < 3 && r.top < rect.bottom + GAP; i++) {
          const extra = rect.bottom + GAP - r.top;
          const base = parseFloat(getComputedStyle(el).marginTop) || 0;
          el.style.marginTop = `${base + extra}px`;
          added.set(el, base + extra);
          r = placed(el);
        }
      }
    }
  };

  layout();
  wide.addEventListener("change", layout);
  window.addEventListener("resize", layout);
  window.addEventListener("load", layout);
  document.fonts?.ready.then(layout);
  // 折りたたみ(aside)を開け閉めすると高さが変わる
  document.addEventListener("toggle", layout, true);
}
