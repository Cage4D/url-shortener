import { describe, expect, it } from "vitest";
import { geometryChanged, heroFontSize, heroLayout, type StageGeometry } from "./hero";

const geo: StageGeometry = { width: 1440, height: 760, cardX: 430, cardY: 300, cardW: 580, cardH: 160, cutWidth: 0 };

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

  it("follows the card when it grows", () => {
    const taller = heroLayout({ ...geo, cardH: 400 });
    expect(taller.hole.height).toBe(428);
    expect(taller.cutTransform).not.toBe(heroLayout(geo).cutTransform);
    expect(taller.shortTransform).toBe(heroLayout(geo).shortTransform);
  });

  it("keeps CUT inside the stage using its measured width", () => {
    const layout = heroLayout({ ...geo, cutWidth: 400 });
    const x = Number(layout.cutTransform.match(/translate\(([\d.]+)/)![1]);
    const overhang = layout.fontSize * 0.72 * Math.tan((12 * Math.PI) / 180);
    expect(x + 400 + overhang).toBeLessThanOrEqual(geo.width - 28 + 0.1);
  });
});

describe("geometryChanged", () => {
  it("ignores sub-pixel jitter", () => {
    expect(geometryChanged(null, geo)).toBe(true);
    expect(geometryChanged(geo, { ...geo, cardH: 160.3 })).toBe(false);
    expect(geometryChanged(geo, { ...geo, cardH: 161 })).toBe(true);
  });
});
