// 「でたらめに点を打って、円周率を求める」図(モンテカルロ法)の計算。
// 一辺 1 の正方形の中にでたらめに点を打つと、4分の1の円(半径 1)に入る割合は、面積の比 π/4 に近づく。
// 図は src/components/figures/MonteCarlo.astro、動きは src/scripts/figures/montecarlo.ts。

export interface Dot {
  x: number;
  y: number;
  // 4分の1の円の中に入ったか
  inside: boolean;
}

// 0 以上 1 未満の数を順に返す、種(seed)付きの乱数。
// 最初に表示する点を、ページをつくるたびに同じ並びにするために使う(mulberry32 という広く使われる方法)
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 点を count 個打つ。random は 0 以上 1 未満の数を返す関数
export function throwDots(count: number, random: () => number): Dot[] {
  return Array.from({ length: count }, () => {
    const x = random();
    const y = random();
    return { x, y, inside: x * x + y * y <= 1 };
  });
}

// 円周率の見積もり = 4 × (円の中に入った点の数 ÷ 全部の点の数)
export const estimatePi = (inside: number, total: number): number => (total === 0 ? 0 : (4 * inside) / total);

// 図の大きさ(SVG の中の長さ)と、最初に打っておく点の数、打てる点の上限(増やしすぎて画面が重くならないように)
export const boardSize = 300;
export const initialCount = 200;
export const maxCount = 5000;
