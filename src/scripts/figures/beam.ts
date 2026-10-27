// 「棚板のたわみ」の図を、つまみの操作に合わせて描き直す。
import { deflectionMm, shelfDefaults, shelfPath } from "../../lib/beam";

export function initBeam(): void {
  document.querySelectorAll<HTMLElement>("[data-beam]").forEach((root) => {
    const form = root.querySelector<HTMLFormElement>("[data-beam-form]");
    const shape = root.querySelector<SVGPathElement>("[data-beam-shape]");
    const result = root.querySelector<HTMLOutputElement>("[data-beam-result]");
    const ratio = root.querySelector<HTMLElement>("[data-beam-ratio]");
    if (!form || !shape || !result || !ratio) return;
    const base = deflectionMm(shelfDefaults);

    const update = () => {
      const data = new FormData(form);
      const input = {
        thicknessMm: Number(data.get("thicknessMm")),
        spanMm: Number(data.get("spanMm")),
        loadKg: Number(data.get("loadKg")),
        e: Number(data.get("e")),
      };
      const delta = deflectionMm(input);
      result.textContent = delta.toFixed(1);
      ratio.textContent = `(最初の設定の ${(delta / base).toFixed(1)} 倍)`;
      for (const [key, value] of Object.entries(input)) {
        const label = root.querySelector(`[data-beam-value="${key}"]`);
        if (label) label.textContent = String(value);
      }
      shape.setAttribute("d", shelfPath(delta));
    };

    form.addEventListener("input", update);
    form.addEventListener("submit", (e) => e.preventDefault());
  });
}
