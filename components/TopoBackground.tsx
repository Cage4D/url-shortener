"use client";

import { useEffect, useRef, useState } from "react";
import { cachedContourPaths } from "@/lib/contours";
import styles from "./TopoBackground.module.css";

type Drawing = { width: number; height: number; paths: string[] };

/** Contour lines behind everything. Drawn once, redrawn only after resizes settle. */
export function TopoBackground() {
  const ref = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<Drawing | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const draw = () => {
      const width = Math.round(el.clientWidth);
      const height = Math.round(el.clientHeight);
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

  return (
    <div ref={ref} className={styles.layer} aria-hidden="true">
      {map && (
        <svg width={map.width} height={map.height} className={styles.svg}>
          {map.paths.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </svg>
      )}
    </div>
  );
}
