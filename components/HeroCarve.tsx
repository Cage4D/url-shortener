"use client";

import { useId, type Ref } from "react";
import type { HeroLayout } from "@/lib/hero";
import styles from "./Stage.module.css";

/**
 * Desktop hero: SHORT (outline) and CUT (solid) drawn in one SVG, with a
 * mask that carves a card-shaped hole through both. For the outlined
 * SHORT the hole's edge is stroked again, clipped to SHORT's glyphs, so
 * the cut letters read as closed shapes instead of open strokes.
 */
export function HeroCarve({
  layout,
  width,
  height,
  cutRef,
}: {
  layout: HeroLayout | null;
  width: number;
  height: number;
  cutRef: Ref<SVGTextElement>;
}) {
  const id = useId().replace(/:/g, "");
  const maskId = `carve-${id}`;
  const clipId = `glyphs-${id}`;
  const fontSize = `${(layout?.fontSize ?? 0).toFixed(1)}px`;
  const hole = layout?.hole;

  return (
    <svg
      className={styles.heroSvg}
      aria-hidden="true"
      width={width}
      height={height}
      style={{ visibility: layout ? "visible" : "hidden" }}
    >
      {hole && (
        <defs>
          <mask id={maskId}>
            <rect x="-4000" y="-4000" width="10000" height="10000" fill="#fff" />
            <rect
              transform={hole.transform}
              x={hole.x}
              y={hole.y}
              width={hole.width}
              height={hole.height}
              rx={hole.r}
              fill="#000"
            />
          </mask>
          <clipPath id={clipId}>
            <text className={styles.heroText} transform={layout.shortTransform} style={{ fontSize }}>
              SHORT
            </text>
          </clipPath>
        </defs>
      )}
      <g mask={hole ? `url(#${maskId})` : undefined}>
        <g className={styles.inLeft}>
          <text
            className={`${styles.heroText} ${styles.heroShort}`}
            transform={layout?.shortTransform}
            style={{ fontSize }}
          >
            SHORT
          </text>
        </g>
        <g className={styles.inRight}>
          <text
            ref={cutRef}
            className={`${styles.heroText} ${styles.heroCut}`}
            transform={layout?.cutTransform}
            style={{ fontSize }}
          >
            CUT
          </text>
        </g>
      </g>
      {hole && (
        <g className={styles.inFade} clipPath={`url(#${clipId})`}>
          <rect
            className={styles.carveEdge}
            transform={hole.transform}
            x={hole.x}
            y={hole.y}
            width={hole.width}
            height={hole.height}
            rx={hole.r}
          />
        </g>
      )}
    </svg>
  );
}
