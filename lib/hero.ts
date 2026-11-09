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
  /** Each word's advance width divided by its font size; 0 if not measured. */
  shortRatio: number;
  cutRatio: number;
};

export type HeroLayout = {
  fontSize: number;
  shortTransform: string;
  cutTransform: string;
  hole: { x: number; y: number; width: number; height: number; r: number; transform: string };
};

export const SKEW_DEG = -12;
const CAP_HEIGHT = 0.72; // cap height of Big Shoulders Display 900, as a share of font size
// Share of SHORT's cap height that sits behind the carve edge (the card's
// edge plus the gap). Low enough that the R's diagonal leg still shows, so
// the word doesn't read as "SHODT".
const SHORT_HIDDEN = 0.3;
// How far SHORT's tail runs over the card's top-left corner, in font sizes:
// about the R and the T, whatever the screen width.
const SHORT_OVERLAP = 0.9;
const TUCK = 0.42;
const CARVE_GAP = 14;
const CARD_RADIUS = 30;
const INSET = 28;
const TAN = Math.tan((Math.abs(SKEW_DEG) * Math.PI) / 180);
// Fallback width ratios until the words have been measured.
const SHORT_RATIO = 2.33;
const CUT_RATIO = 1.35;

const f = (n: number) => n.toFixed(1);

export function heroFontSize(stageWidth: number): number {
  return Math.max(120, Math.min(330, stageWidth * 0.2));
}

export function heroLayout(g: StageGeometry): HeroLayout {
  const fontSize = heroFontSize(g.width);
  const cap = fontSize * CAP_HEIGHT;

  // SHORT sits top-left, its lower part tucked behind the card's top edge
  // and its last letters over the card's (skewed) top-left corner.
  const holeTopLeft = g.cardX - CARVE_GAP + (g.cardH / 2 + CARVE_GAP) * TAN;
  const shortWidth = (g.shortRatio || SHORT_RATIO) * fontSize;
  const shortX = Math.max(INSET, holeTopLeft + SHORT_OVERLAP * fontSize - shortWidth);
  const shortY = g.cardY - CARVE_GAP + cap * SHORT_HIDDEN;

  // CUT sits bottom-right; its top tucks under the card's bottom edge.
  // The skew pushes the tops of the letters right by cap * tan(12deg), which
  // the text's advance width doesn't include, so leave room for it too.
  const cutWidth = (g.cutRatio || CUT_RATIO) * fontSize;
  const overhang = cap * TAN;
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

/**
 * True when two measurements differ enough to matter: half a pixel for
 * sizes, a small fraction for the width ratios (which are around 1–2.5).
 */
export function geometryChanged(a: StageGeometry | null, b: StageGeometry): boolean {
  if (!a) return true;
  return (Object.keys(b) as (keyof StageGeometry)[]).some((k) => {
    const tolerance = k === "shortRatio" || k === "cutRatio" ? 0.002 : 0.5;
    return Math.abs(a[k] - b[k]) >= tolerance;
  });
}
