/**
 * Geometry for the SHORT / CUT hero and the carve around the card.
 * All numbers are in the stage's coordinate space (CSS pixels).
 */

export type StageGeometry = {
  /** Stage size. */
  width: number;
  height: number;
  /** Card box, untransformed (offsetLeft/Top/Width/Height). */
  cardX: number;
  cardY: number;
  cardW: number;
  cardH: number;
  /** Measured advance width of the CUT text, 0 if not measured yet. */
  cutWidth: number;
};

export type HeroLayout = {
  fontSize: number;
  shortTransform: string;
  cutTransform: string;
  hole: { x: number; y: number; width: number; height: number; r: number; transform: string };
};

export const SKEW_DEG = -12;
const CAP_HEIGHT = 0.72; // cap height of Big Shoulders Display 900, as a share of font size
const TUCK = 0.42; // share of each word's cap height hidden behind the card
const CARVE_GAP = 14;
const CARD_RADIUS = 30;
const INSET = 28;

const f = (n: number) => n.toFixed(1);

export function heroFontSize(stageWidth: number): number {
  return Math.max(120, Math.min(330, stageWidth * 0.2));
}

export function heroLayout(g: StageGeometry): HeroLayout {
  const fontSize = heroFontSize(g.width);
  const cap = fontSize * CAP_HEIGHT;

  // SHORT sits top-left with its baseline pushed below the card's top edge.
  const shortX = INSET;
  const shortY = g.cardY + cap * TUCK;

  // CUT sits bottom-right; its top tucks under the card's bottom edge.
  // The skew pushes the tops of the letters right by cap * tan(12deg), which
  // the text's advance width doesn't include, so leave room for it too.
  const cutWidth = g.cutWidth || fontSize * 1.35;
  const overhang = cap * Math.tan((Math.abs(SKEW_DEG) * Math.PI) / 180);
  const cutX = Math.min(g.width - INSET - cutWidth - overhang, g.cardX + g.cardW - fontSize * 0.45);
  const cutY = g.cardY + g.cardH - cap * TUCK + cap;

  // The hole matches the card plus a gap, skewed around the card's centre
  // exactly like the card itself is.
  const cx = g.cardX + g.cardW / 2;
  const cy = g.cardY + g.cardH / 2;

  return {
    fontSize,
    shortTransform: `translate(${f(shortX)} ${f(shortY)}) skewX(${SKEW_DEG})`,
    cutTransform: `translate(${f(cutX)} ${f(cutY)}) skewX(${SKEW_DEG})`,
    hole: {
      x: g.cardX - CARVE_GAP,
      y: g.cardY - CARVE_GAP,
      width: g.cardW + CARVE_GAP * 2,
      height: g.cardH + CARVE_GAP * 2,
      r: CARD_RADIUS + CARVE_GAP,
      transform: `translate(${f(cx)} ${f(cy)}) skewX(${SKEW_DEG}) translate(${f(-cx)} ${f(-cy)})`,
    },
  };
}

/** True when two measurements differ by half a pixel or more anywhere. */
export function geometryChanged(a: StageGeometry | null, b: StageGeometry): boolean {
  if (!a) return true;
  return (Object.keys(b) as (keyof StageGeometry)[]).some((k) => Math.abs(a[k] - b[k]) >= 0.5);
}
