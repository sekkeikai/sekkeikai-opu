// フィッツの法則のデモ。
// 丸をクリックするたびに、前回クリックした位置からの距離 D と丸の直径 W から
// 難しさ ID = log2(D / W + 1) を計算し、かかった時間 MT と一緒にグラフへ点を打つ。
// 3 点以上たまったら、最小二乗法で MT = a + b × ID の直線を引く。
const TRIALS = 20;
const SIZES = [14, 20, 28, 40, 56, 76]; // 丸の直径(px)
const PLOT = { left: 44, right: 290, top: 26, bottom: 184, maxId: 6, maxMt: 1500 };
const SVG_NS = "http://www.w3.org/2000/svg";
const HINT =
  "オレンジの丸を、マウスや指でできるだけ速く正確に押してください。全 20 回(キーボードでは時間を正しく測れません)。";

interface Trial {
  id: number;
  mt: number;
}

function regression(trials: Trial[]) {
  const n = trials.length;
  const mx = trials.reduce((s, t) => s + t.id, 0) / n;
  const my = trials.reduce((s, t) => s + t.mt, 0) / n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (const t of trials) {
    sxy += (t.id - mx) * (t.mt - my);
    sxx += (t.id - mx) ** 2;
    syy += (t.mt - my) ** 2;
  }
  const b = sxx > 0 ? sxy / sxx : 0;
  const r = sxx > 0 && syy > 0 ? sxy / Math.sqrt(sxx * syy) : 0;
  return { a: my - b * mx, b, r };
}

const px = (id: number) => PLOT.left + (Math.min(id, PLOT.maxId) / PLOT.maxId) * (PLOT.right - PLOT.left);
const py = (mt: number) => PLOT.bottom - (Math.min(mt, PLOT.maxMt) / PLOT.maxMt) * (PLOT.bottom - PLOT.top);

export function initFitts(): void {
  document.querySelectorAll<HTMLElement>("[data-fitts]").forEach((root) => {
    const area = root.querySelector<HTMLElement>("[data-fitts-area]")!;
    const target = root.querySelector<HTMLButtonElement>("[data-fitts-target]")!;
    const hint = root.querySelector<HTMLElement>("[data-fitts-hint]")!;
    const points = root.querySelector<SVGGElement>("[data-fitts-points]")!;
    const line = root.querySelector<SVGLineElement>("[data-fitts-line]")!;
    const count = root.querySelector<HTMLElement>("[data-fitts-count]")!;
    const miss = root.querySelector<HTMLElement>("[data-fitts-miss]")!;
    const formula = root.querySelector<HTMLElement>("[data-fitts-formula]")!;
    const corr = root.querySelector<HTMLElement>("[data-fitts-r]")!;
    const reset = root.querySelector<HTMLButtonElement>("[data-fitts-reset]")!;

    let trials: Trial[] = [];
    let misses = 0;
    let last: { x: number; y: number; time: number } | null = null;
    let current = { x: 0, y: 0, w: 64 };

    // 丸を新しい場所に置く。前の位置から近すぎない場所を選ぶ
    const place = () => {
      const rect = area.getBoundingClientRect();
      const w = SIZES[Math.floor(Math.random() * SIZES.length)];
      let x = 0;
      let y = 0;
      for (let i = 0; i < 30; i++) {
        x = w / 2 + 8 + Math.random() * (rect.width - w - 16);
        y = w / 2 + 8 + Math.random() * (rect.height - w - 40);
        if (!last || Math.hypot(x - last.x, y - last.y) > Math.min(rect.width, rect.height) * 0.35) break;
      }
      current = { x, y, w };
      // 中身の文字は消すので、読み上げ用の名前を付け直す
      target.setAttribute("aria-label", `目標(${trials.length + 1}回目)`);
      Object.assign(target.style, {
        left: `${x}px`,
        top: `${y}px`,
        width: `${w}px`,
        height: `${w}px`,
      });
    };

    const draw = () => {
      count.textContent = String(trials.length);
      miss.textContent = String(misses);
      points.replaceChildren(
        ...trials.map((t) => {
          const c = document.createElementNS(SVG_NS, "circle");
          c.setAttribute("cx", px(t.id).toFixed(1));
          c.setAttribute("cy", py(t.mt).toFixed(1));
          c.setAttribute("r", "4");
          return c;
        }),
      );
      if (trials.length < 3) {
        line.setAttribute("visibility", "hidden");
        formula.textContent = "—";
        corr.textContent = "—";
        return;
      }
      const { a, b, r } = regression(trials);
      line.setAttribute("visibility", "visible");
      line.setAttribute("x1", String(px(0)));
      line.setAttribute("y1", String(py(Math.max(0, a))));
      line.setAttribute("x2", String(px(PLOT.maxId)));
      line.setAttribute("y2", String(py(Math.max(0, a + b * PLOT.maxId))));
      formula.textContent = `MT = ${Math.round(a)} ${b < 0 ? "−" : "+"} ${Math.abs(Math.round(b))} × ID`;
      corr.textContent = `r = ${r.toFixed(2)}`;
    };

    const start = () => {
      trials = [];
      misses = 0;
      last = null;
      target.textContent = "開始";
      target.removeAttribute("aria-label");
      target.hidden = false;
      Object.assign(target.style, { left: "50%", top: "50%", width: "64px", height: "64px" });
      current = { x: area.clientWidth / 2, y: area.clientHeight / 2, w: 64 };
      hint.textContent = HINT;
      draw();
    };

    target.addEventListener("click", (event) => {
      event.stopPropagation();
      const now = performance.now();
      const rect = area.getBoundingClientRect();
      // キーボードで押したとき(座標が 0)は、丸の中心を押したことにする
      const x = event.clientX ? event.clientX - rect.left : current.x;
      const y = event.clientY ? event.clientY - rect.top : current.y;
      if (last) {
        const d = Math.hypot(current.x - last.x, current.y - last.y);
        const mt = now - last.time;
        // 3 秒以上かかった回は、よそ見などとみなして記録しない
        if (mt < 3000) trials.push({ id: Math.log2(d / current.w + 1), mt });
      }
      target.textContent = "";
      if (trials.length >= TRIALS) {
        target.hidden = true;
        hint.textContent = "おつかれさまでした。右のグラフが、あなたの手と目の「性能」です。";
        draw();
        return;
      }
      last = { x, y, time: now };
      place();
      draw();
    });

    area.addEventListener("click", () => {
      if (last && !target.hidden) {
        misses += 1;
        draw();
      }
    });

    reset.addEventListener("click", start);
    start();
  });
}
