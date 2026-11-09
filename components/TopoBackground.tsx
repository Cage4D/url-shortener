"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cachedContourPaths, splitLines, type ContourLine } from "@/lib/contours";
import { ContourPulses, usePulses } from "./ContourPulses";
import styles from "./TopoBackground.module.css";

type Drawing = { width: number; height: number; paths: string[] };

// The map is drawn this much larger than the page on every side so the
// slow drift never shows an edge.
const BLEED = 24;

// Pulses only run on lines long enough to show some travel.
const MIN_PULSE_LINE = 240;

/**
 * Contour lines behind everything. Drawn once, redrawn only after resizes
 * settle. Alternate levels sit on two layers that drift a few pixels on
 * long, out-of-step loops, and small pulses of light run along random
 * lines now and then.
 */
export function TopoBackground() {
  const ref = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<Drawing | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const draw = () => {
      const width = Math.round(el.clientWidth) + BLEED * 2;
      const height = Math.round(el.clientHeight) + BLEED * 2;
      setMap((prev) =>
        prev && prev.width === width && prev.height === height
          ? prev
          : { width, height, paths: cachedContourPaths(width, height) },
      );
    };

    draw();
    const observer = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(draw, 150);
    });
    observer.observe(el);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  // Lines that pulses can run along, grouped by the layer they're drawn on.
  const lines = useMemo<ContourLine[][] | null>(() => {
    if (!map) return null;
    const byLayer: ContourLine[][] = [[], []];
    map.paths.forEach((d, i) => {
      for (const line of splitLines(d)) if (line.length >= MIN_PULSE_LINE) byLayer[i % 2].push(line);
    });
    return byLayer;
  }, [map]);
  const { pulses, done } = usePulses(lines);

  return (
    <div ref={ref} className={styles.layer} aria-hidden="true">
      {map &&
        [0, 1].map((layer) => (
          <svg
            key={layer}
            width={map.width}
            height={map.height}
            className={`${styles.svg} ${layer ? styles.driftB : styles.driftA}`}
            style={{ left: -BLEED, top: -BLEED }}
          >
            {map.paths.map((d, i) => (i % 2 === layer ? <path key={i} d={d} /> : null))}
            <ContourPulses pulses={pulses} layer={layer} onDone={done} />
          </svg>
        ))}
    </div>
  );
}
