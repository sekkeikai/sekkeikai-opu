// 「でたらめに点を打って、円周率を求める」図で、ボタンを押すたびに点を足して、見積もりを計算し直す。
import { boardSize, estimatePi, maxCount, throwDots } from "../../lib/montecarlo";

const SVG_NS = "http://www.w3.org/2000/svg";

export function initMonteCarlo(): void {
  document.querySelectorAll<HTMLElement>("[data-montecarlo]").forEach((root) => {
    const dots = root.querySelector<SVGGElement>("[data-montecarlo-dots]");
    const totalOut = root.querySelector<HTMLElement>("[data-montecarlo-total]");
    const insideOut = root.querySelector<HTMLElement>("[data-montecarlo-inside]");
    const piOut = root.querySelector<HTMLElement>("[data-montecarlo-pi]");
    const addButtons = root.querySelectorAll<HTMLButtonElement>("[data-montecarlo-add]");
    const reset = root.querySelector<HTMLButtonElement>("[data-montecarlo-reset]");
    if (!dots || !totalOut || !insideOut || !piOut || !reset) return;

    // 最初からある点(ページをつくるときに打った点)を数える
    let total = dots.childElementCount;
    let inside = dots.querySelectorAll("[data-inside]").length;

    const show = () => {
      totalOut.textContent = total.toLocaleString("ja-JP");
      insideOut.textContent = inside.toLocaleString("ja-JP");
      piOut.textContent = total === 0 ? "—" : estimatePi(inside, total).toFixed(3);
      // 上限に届いたら、足すボタンを押せなくする
      addButtons.forEach((b) => (b.disabled = total >= maxCount));
    };

    addButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const count = Math.min(Number(button.dataset.montecarloAdd), maxCount - total);
        for (const dot of throwDots(count, Math.random)) {
          const circle = document.createElementNS(SVG_NS, "circle");
          circle.setAttribute("cx", String(dot.x * boardSize));
          // 図では下が 0 になるように、上下を逆にして描く
          circle.setAttribute("cy", String((1 - dot.y) * boardSize));
          circle.setAttribute("r", "1.6");
          circle.setAttribute("fill", dot.inside ? "var(--color-link)" : "var(--color-accent-strong)");
          if (dot.inside) circle.setAttribute("data-inside", "");
          dots.append(circle);
        }
        total += count;
        inside = dots.querySelectorAll("[data-inside]").length;
        show();
      });
    });

    reset.addEventListener("click", () => {
      dots.replaceChildren();
      total = 0;
      inside = 0;
      show();
    });
  });
}
