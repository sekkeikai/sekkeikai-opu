// 長文を読むための補助(アニメーションではなく、読んでいる位置を知らせるだけ)。
// - [data-progress]: ヘッダーの下の線。[data-progress-target] の要素をどこまで読んだかで長さが変わる
// - [data-toc]: 目次。いま画面に出ている章([data-toc-section])のリンクに aria-current を付ける
export function initReading(): void {
  const bar = document.querySelector<HTMLElement>("[data-progress]");
  const target = document.querySelector<HTMLElement>("[data-progress-target]");
  if (bar && target) {
    const update = () => {
      const rect = target.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const ratio = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 1;
      bar.style.width = `${(ratio * 100).toFixed(2)}%`;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  }

  const links = new Map<string, HTMLElement>();
  document.querySelectorAll<HTMLAnchorElement>("[data-toc] a[href^='#']").forEach((a) => {
    links.set(a.getAttribute("href")!.slice(1), a);
  });
  if (links.size === 0) return;

  // 画面の上から 1/3 あたりの線を越えた、一番下の章を「いま読んでいる章」とする
  const sections = [...document.querySelectorAll<HTMLElement>("[data-toc-section]")];
  const mark = () => {
    const line = window.innerHeight / 3;
    let current: HTMLElement | undefined;
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= line) current = section;
    }
    links.forEach((a, id) => a.setAttribute("aria-current", String(id === current?.id)));
  };
  mark();
  window.addEventListener("scroll", mark, { passive: true });
}
