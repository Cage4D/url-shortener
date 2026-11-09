import { describe, expect, it } from "vitest";
import { geometryChanged, heroFontSize, heroLayout, readoutClashes, type StageGeometry } from "./hero";

const geo: StageGeometry = {
  width: 1440,
  height: 760,
  cardX: 430,
  cardY: 300,
  cardW: 580,
  cardH: 160,
  shortRatio: 2.3,
  cutRatio: 1.3,
};

const TAN12 = Math.tan((12 * Math.PI) / 180);
const translate = (t: string) => t.match(/translate\(([-\d.]+) ([-\d.]+)\)/)!.slice(1).map(Number);

describe("heroFontSize", () => {
  it("is 20% of the stage width, clamped to 120–330px", () => {
    expect(heroFontSize(400)).toBe(120);
    expect(heroFontSize(1000)).toBe(200);
    expect(heroFontSize(3000)).toBe(330);
  });
});

describe("heroLayout", () => {
  it("cuts a hole 14px around the card, skewed about the card's centre", () => {
    const { hole } = heroLayout(geo);
    expect(hole).toMatchObject({ x: 416, y: 286, width: 608, height: 188, r: 44 });
    expect(hole.transform).toBe("translate(720.0 380.0) skewX(-12) translate(-720.0 -380.0)");
  });

  it("hides only the lower 30% of SHORT so the R keeps its leg", () => {
    const layout = heroLayout(geo);
    const cap = layout.fontSize * 0.72;
    const [, baseline] = translate(layout.shortTransform);
    const carveTop = geo.cardY - 14;
    expect((baseline - carveTop) / cap).toBeCloseTo(0.3, 2);
  });

  it("runs SHORT's tail about 0.9 font sizes over the card's top-left corner", () => {
    const layout = heroLayout({ ...geo, width: 1920, cardX: 670 });
    const [x] = translate(layout.shortTransform);
    const holeTopLeft = 670 - 14 + (160 / 2 + 14) * TAN12;
    expect(x + 2.3 * layout.fontSize - holeTopLeft).toBeCloseTo(0.9 * layout.fontSize, 0);
  });

  it("never pushes SHORT past the stage's left inset", () => {
    const [x] = translate(heroLayout({ ...geo, width: 1000, cardX: 210 }).shortTransform);
    expect(x).toBe(28);
  });

  it("tucks only the top 30% of CUT and the top-left of its C under the card", () => {
    const layout = heroLayout(geo);
    const cap = layout.fontSize * 0.72;
    const [x, baseline] = translate(layout.cutTransform);
    const carveBottom = geo.cardY + geo.cardH + 14;
    expect((carveBottom - (baseline - cap)) / cap).toBeCloseTo(0.3, 2);
    const holeBottomRight = geo.cardX + geo.cardW + 14 - (geo.cardH / 2 + 14) * TAN12;
    expect(holeBottomRight - x).toBeCloseTo(0.34 * layout.fontSize, 0);
  });

  it("shrinks the hero on narrow screens instead of burying the C", () => {
    const narrow = { ...geo, width: 1000, cardX: 210, cardH: 136 };
    const layout = heroLayout(narrow);
    expect(layout.fontSize).toBeLessThan(heroFontSize(1000));
    const [x] = translate(layout.cutTransform);
    const holeBottomRight = 210 + 580 + 14 - (136 / 2 + 14) * TAN12;
    expect(holeBottomRight - x).toBeCloseTo(0.34 * layout.fontSize, 0);
  });

  it("shrinks the words to keep them inside the stage when the card is tall", () => {
    const full = { ...geo, height: 781, cardY: 135, cardH: 512 };
    const layout = heroLayout(full);
    const cap = layout.fontSize * 0.72;
    expect(layout.fontSize).toBeLessThan(heroFontSize(1440));
    const [, shortBaseline] = translate(layout.shortTransform);
    const [, cutBaseline] = translate(layout.cutTransform);
    expect(shortBaseline - cap).toBeGreaterThanOrEqual(16 - 0.1);
    expect(cutBaseline).toBeLessThanOrEqual(781 - 16 + 0.1);
  });

  it("keeps the full width-based size when there's room", () => {
    expect(heroLayout({ ...geo, height: 900 }).fontSize).toBe(heroFontSize(1440));
  });

  it("follows the card when it grows", () => {
    const taller = heroLayout({ ...geo, cardH: 400 });
    expect(taller.hole.height).toBe(428);
    expect(taller.cutTransform).not.toBe(heroLayout(geo).cutTransform);
  });

  it("keeps CUT inside the stage, skew overhang included", () => {
    const layout = heroLayout({ ...geo, cutRatio: 2 });
    const [x] = translate(layout.cutTransform);
    const overhang = layout.fontSize * 0.72 * TAN12;
    expect(x + 2 * layout.fontSize + overhang).toBeLessThanOrEqual(geo.width - 28 + 0.1);
  });
});

describe("readoutClashes", () => {
  it("leaves the readouts alone when the card is clear of them", () => {
    expect(readoutClashes(geo)).toEqual({ telemetry: false, description: false });
  });

  it("flags the telemetry when a tall card reaches the top-right on a narrow screen", () => {
    const full = { ...geo, width: 1000, height: 681, cardX: 210, cardY: 60, cardH: 560 };
    expect(readoutClashes(full).telemetry).toBe(true);
  });

  it("flags the description when the card's lower-left reaches it", () => {
    const low = { ...geo, width: 1000, height: 681, cardX: 210, cardY: 60, cardH: 600 };
    expect(readoutClashes(low).description).toBe(true);
  });
});

describe("geometryChanged", () => {
  it("ignores sub-pixel jitter", () => {
    expect(geometryChanged(null, geo)).toBe(true);
    expect(geometryChanged(geo, { ...geo, cardH: 160.3 })).toBe(false);
    expect(geometryChanged(geo, { ...geo, cardH: 161 })).toBe(true);
  });

  it("notices when a word's measured width changes, e.g. once the font loads", () => {
    expect(geometryChanged(geo, { ...geo, shortRatio: 2.27 })).toBe(true);
    expect(geometryChanged(geo, { ...geo, shortRatio: 2.3001 })).toBe(false);
  });
});
