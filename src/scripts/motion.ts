// サイト全体の動き（GSAP + Lenis）。
// - OS の「視差効果を減らす」設定がオンの人には動きを一切付けない
// - スムーススクロール（Lenis）はマウス操作の端末だけ。スマホは標準スクロールのまま
// 動きの長さやイージングは tokens/tokens.json の motion で決める（CSS 変数から読む）
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

// CSS 変数の長さ（"700ms" や ".7s"）を秒に直す。読めなければ fallback（秒）
function readSeconds(name: string, fallback: number): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const value = parseFloat(raw);
  if (!Number.isFinite(value)) return fallback;
  return raw.endsWith("ms") ? value / 1000 : value;
}

export function initMotion(): void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add("motion-ready");

  const base = readSeconds("--motion-duration-base", 0.7);
  const draw = readSeconds("--motion-duration-draw", 1.6);
  const ease = "power3.out";

  if (window.matchMedia("(pointer: fine)").matches) {
    const lenis = new Lenis();
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // data-reveal: スクロールで下からふわっと現れる
  gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: base,
      ease,
      delay: Number(el.dataset.revealDelay ?? 0),
      scrollTrigger: { trigger: el, start: "top 85%", once: true },
    });
  });

  // data-draw: SVG の線を描くように表示する
  gsap.utils.toArray<SVGGeometryElement>("[data-draw]").forEach((path) => {
    // スマホなどで非表示（display: none）の線は長さを測れないので飛ばす
    if (path.getClientRects().length === 0) return;
    const length = path.getTotalLength();
    gsap.fromTo(
      path,
      { strokeDasharray: length, strokeDashoffset: length },
      {
        strokeDashoffset: 0,
        duration: draw,
        ease: "power2.inOut",
        scrollTrigger: { trigger: path.closest("section") ?? path, start: "top 75%", once: true },
      },
    );
  });
}
