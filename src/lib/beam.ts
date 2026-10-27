// 棚板のたわみの計算(「モデル化」のページの図で使う)。
// 両端を支えた板(単純支持梁)に、本の重さが均等にかかる(等分布荷重)と仮定したモデル:
//   たわみ δ = 5 w L⁴ / (384 E I)、 w = 重さ × 9.81 / L、 I = 奥行き × 厚さ³ / 12
// 材料の硬さ(ヤング率 E)は木材としてのおおよその目安。実際は製品や木目の向きで大きく変わる。
export const materials = [
  { id: "glulam", name: "針葉樹の集成材", e: 9e9 },
  { id: "plywood", name: "合板", e: 7e9 },
  { id: "mdf", name: "MDF", e: 3e9 },
] as const;

export interface ShelfInput {
  thicknessMm: number;
  spanMm: number;
  loadKg: number;
  e: number;
}

export const shelfDefaults: ShelfInput = { thicknessMm: 18, spanMm: 900, loadKg: 20, e: materials[0].e };
export const depthMm = 250;

export function deflectionMm({ thicknessMm, spanMm, loadKg, e }: ShelfInput): number {
  const L = spanMm / 1000;
  const t = thicknessMm / 1000;
  const b = depthMm / 1000;
  const w = (loadKg * 9.81) / L;
  const I = (b * t ** 3) / 12;
  return ((5 * w * L ** 4) / (384 * e * I)) * 1000;
}

// たわんだ形(両端 0、中央 1)。等分布荷重の梁の式 ξ − 2ξ³ + ξ⁴ を中央の値で割ったもの
export function deflectedShape(xi: number): number {
  return (xi - 2 * xi ** 3 + xi ** 4) / 0.3125;
}

// 図に描く棚板の線(SVG の path)。たわみは見やすいように 6 倍に誇張し、大きすぎるときは頭打ちにする
export function shelfPath(delta: number): string {
  const points: string[] = [];
  for (let i = 0; i <= 30; i++) {
    const xi = i / 30;
    const y = 70 + Math.min(delta * 6, 70) * deflectedShape(xi);
    points.push(`${i === 0 ? "M" : "L"}${(60 + xi * 480).toFixed(1)} ${y.toFixed(1)}`);
  }
  return points.join(" ");
}
