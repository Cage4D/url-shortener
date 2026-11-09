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
const TUCK = 0.42; // share of each word's cap height hidden behind the card
const CARVE_GAP = 14;
const CARD_RADIUS = 30;
const INSET = 28;
const TAN = Math.tan((Math.abs(SKEW_DEG) * Math.PI) / 180);
// Fallbacks for each word's width per pixel of font size until measured.
const SHORT_RATIO = 2.15;
const CUT_RATIO = 1.35;
// Smallest the hero may shrink to when a tall card leaves it little room.
const MIN_FONT_SIZE = 96;
// Clear space kept between the words and the stage's top and bottom.
const EDGE = 16;

const f = (n: number) => n.toFixed(1);

export function heroFontSize(stageWidth: number): number {
  return Math.max(120, Math.min(330, stageWidth * 0.2));
}

export function heroLayout(g: StageGeometry): HeroLayout {
  // Normally 20% of the width. When the card is tall (a result plus recent
  // links), shrink so SHORT and CUT stay inside the stage instead of running
  // into the header and footer; each word sticks out (1 - TUCK) of its cap
  // height beyond the card. The words grow back as the card shrinks.
  const cardBottom = g.cardY + g.cardH;
  const outside = CAP_HEIGHT * (1 - TUCK);
  const fitsAbove = (g.cardY - EDGE) / outside;
  const fitsBelow = (g.height - cardBottom - EDGE) / outside;
  const fontSize = Math.max(MIN_FONT_SIZE, Math.min(heroFontSize(g.width), fitsAbove, fitsBelow));
  const cap = fontSize * CAP_HEIGHT;

  // CUT sits bottom-right; its top tucks under the card's bottom edge.
  // The skew pushes the tops of the letters right by cap * tan(12deg), which
  // the text's advance width doesn't include, so leave room for it too.
  const cutWidth = (g.cutRatio || CUT_RATIO) * fontSize;
  const overhang = cap * TAN;
  const cutX = Math.min(g.width - INSET - cutWidth - overhang, g.cardX + g.cardW - fontSize * 0.45);
  const cutY = cardBottom - cap * TUCK + cap;

  // The card is skewed about its centre, so it looks the same turned
  // upside down. SHORT is CUT turned the same way: its top-right corner
  // lands where CUT's bottom-left corner would, so both words sit the same
  // distance from their corner of the card. Its baseline sits below the
  // card's top edge by the same share CUT's top sits above the bottom.
  const cx = g.cardX + g.cardW / 2;
  const cy = g.cardY + g.cardH / 2;
  const shortWidth = (g.shortRatio || SHORT_RATIO) * fontSize;
  const shortX = Math.max(INSET, 2 * cx - cutX - shortWidth - overhang);
  const shortY = g.cardY + cap * TUCK;

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
      // The hole is the card plus a gap, skewed about the card's centre
      // exactly like the card itself is.
      transform: `translate(${f(cx)} ${f(cy)}) skewX(${SKEW_DEG}) translate(${f(-cx)} ${f(-cy)})`,
    },
  };
}

// Where the small readouts sit in the stage (mirrors Stage.module.css),
// plus a little clearance.
const TELEMETRY = { right: 40, top: 36, width: 240, height: 60 };
const DESCRIPTION = { left: 40, bottom: 36, width: 290, height: 44 };
const CLEARANCE = 8;

/**
 * Which readouts the (skewed) card would run into. The card's sides lean:
 * at height y its edges are shifted by (centre y - y) * tan(12deg).
 */
export function readoutClashes(g: StageGeometry): { telemetry: boolean; description: boolean } {
  const cy = g.cardY + g.cardH / 2;
  const cardBottom = g.cardY + g.cardH;
  const shift = (y: number) => (cy - y) * TAN;

  const tTop = TELEMETRY.top - CLEARANCE;
  const tBottom = TELEMETRY.top + TELEMETRY.height + CLEARANCE;
  const tLeft = g.width - TELEMETRY.right - TELEMETRY.width - CLEARANCE;
  const yt = Math.max(g.cardY, tTop); // highest card row level with the readout
  const telemetry = g.cardY < tBottom && cardBottom > tTop && g.cardX + g.cardW + shift(yt) > tLeft;

  const dBottom = g.height - DESCRIPTION.bottom + CLEARANCE;
  const dTop = g.height - DESCRIPTION.bottom - DESCRIPTION.height - CLEARANCE;
  const dRight = DESCRIPTION.left + DESCRIPTION.width + CLEARANCE;
  const yd = Math.min(cardBottom, dBottom); // lowest card row level with the readout
  const description = cardBottom > dTop && g.cardY < dBottom && g.cardX + shift(yd) < dRight;

  return { telemetry, description };
}

/**
 * True when two measurements differ enough to matter: half a pixel for
 * sizes, a small fraction for the words' width ratios (around 1.3 and 2.2).
 */
export function geometryChanged(a: StageGeometry | null, b: StageGeometry): boolean {
  if (!a) return true;
  return (Object.keys(b) as (keyof StageGeometry)[]).some((k) => {
    const tolerance = k === "cutRatio" || k === "shortRatio" ? 0.002 : 0.5;
    return Math.abs(a[k] - b[k]) >= tolerance;
  });
}
