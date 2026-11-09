import { describe, expect, it } from "vitest";
import { geometryChanged, heroFontSize, heroLayout, readoutClashes, type StageGeometry } from "./hero";

const geo: StageGeometry = {
  width: 1440,
  height: 760,
  cardX: 430,
  cardY: 300,
  cardW: 580,
  cardH: 160,
  shortRatio: 2.1,
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

  it("tucks the lower 42% of SHORT and the top 42% of CUT behind the card", () => {
    const layout = heroLayout(geo);
    const cap = layout.fontSize * 0.72;
    const [, shortBaseline] = translate(layout.shortTransform);
    const [, cutBaseline] = translate(layout.cutTransform);
    expect((shortBaseline - geo.cardY) / cap).toBeCloseTo(0.42, 2);
    expect((geo.cardY + geo.cardH - (cutBaseline - cap)) / cap).toBeCloseTo(0.42, 2);
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

  it("puts SHORT as close to the card's top-left as CUT is to its bottom-right", () => {
    // A tall card (result plus recent links) shrinks the words.
    const full = { ...geo, cardY: 72, cardH: 560 };
    const layout = heroLayout(full);
    const overhang = layout.fontSize * 0.72 * TAN12;
    const [shortX] = translate(layout.shortTransform);
    const [cutX] = translate(layout.cutTransform);
    const shortTopRight = shortX + 2.1 * layout.fontSize + overhang;
    // Mirror images through the card's centre (the card looks the same
    // turned upside down), so the two corners average to the centre.
    expect(shortX).toBeGreaterThan(28);
    expect((shortTopRight + cutX) / 2).toBeCloseTo(full.cardX + full.cardW / 2, 1);
  });

  it("keeps SHORT inside the stage when the card is far left", () => {
    const [shortX] = translate(heroLayout({ ...geo, cardX: 40 }).shortTransform);
    expect(shortX).toBe(28);
  });

  it("keeps the full width-based size when there's room", () => {
    expect(heroLayout({ ...geo, height: 900 }).fontSize).toBe(heroFontSize(1440));
  });

  it("follows the card when it grows", () => {
    const taller = heroLayout({ ...geo, height: 1100, cardH: 400 });
    expect(taller.hole.height).toBe(428);
    expect(taller.cutTransform).not.toBe(heroLayout({ ...geo, height: 1100 }).cutTransform);
    expect(taller.shortTransform).toBe(heroLayout({ ...geo, height: 1100 }).shortTransform);
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
    expect(geometryChanged(geo, { ...geo, cutRatio: 1.27 })).toBe(true);
    expect(geometryChanged(geo, { ...geo, cutRatio: 1.3001 })).toBe(false);
    expect(geometryChanged(geo, { ...geo, shortRatio: 2.05 })).toBe(true);
  });
});
