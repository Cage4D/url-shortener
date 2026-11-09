"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ContourLine } from "@/lib/contours";
import styles from "./TopoBackground.module.css";

export type Pulse = { id: number; layer: number; line: ContourLine; start: number; travel: number; duration: number };

const DASH = 46; // length of the glowing segment, in px
const SPEED = 70; // px per second

/** Pick a random line and a stretch of it for a pulse to travel. */
export function makePulse(id: number, lines: ContourLine[][], random = Math.random): Pulse | null {
  const layer = random() < 0.5 ? 0 : 1;
  const pool = lines[layer];
  if (!pool?.length) return null;
  const line = pool[Math.floor(random() * pool.length)];
  const travel = Math.min(line.length, 220 + random() * 260);
  const start = random() * Math.max(0, line.length - travel);
  return { id, layer, line, start, travel, duration: (travel / SPEED) * 1000 };
}

/** One dash sliding along its line, fading in at the start and out at the end. */
function PulsePath({ pulse, onDone }: { pulse: Pulse; onDone: (id: number) => void }) {
  const ref = useRef<SVGPathElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el?.animate) return;
    const animation = el.animate(
      [
        { strokeDashoffset: -pulse.start, opacity: 0 },
        { opacity: 1, offset: 0.25 },
        { opacity: 1, offset: 0.7 },
        { strokeDashoffset: -(pulse.start + pulse.travel), opacity: 0 },
      ],
      { duration: pulse.duration, easing: "linear", fill: "both" },
    );
    animation.onfinish = () => onDone(pulse.id);
    return () => animation.cancel();
  }, [pulse, onDone]);

  return (
    <path
      ref={ref}
      d={pulse.line.d}
      className={styles.pulse}
      style={{ strokeDasharray: `${DASH} ${pulse.line.length + DASH}`, opacity: 0 }}
    />
  );
}

export function ContourPulses({ pulses, layer, onDone }: { pulses: Pulse[]; layer: number; onDone: (id: number) => void }) {
  return (
    <g>
      {pulses
        .filter((p) => p.layer === layer)
        .map((p) => (
          <PulsePath key={p.id} pulse={p} onDone={onDone} />
        ))}
    </g>
  );
}

const MAX_PULSES = 4;

/**
 * Spawns pulses at random intervals while there are lines to run on.
 * Nothing runs when the viewer prefers reduced motion.
 */
export function usePulses(lines: ContourLine[][] | null) {
  const [pulses, setPulses] = useState<Pulse[]>([]);
  const nextId = useRef(0);

  useEffect(() => {
    if (!lines) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let timer: ReturnType<typeof setTimeout>;
    const spawn = () => {
      setPulses((current) => {
        if (current.length >= MAX_PULSES || document.hidden) return current;
        const pulse = makePulse(nextId.current++, lines);
        return pulse ? [...current, pulse] : current;
      });
      timer = setTimeout(spawn, 700 + Math.random() * 2300);
    };
    timer = setTimeout(spawn, 1200);
    return () => {
      clearTimeout(timer);
      setPulses([]);
    };
  }, [lines]);

  const done = useCallback((id: number) => setPulses((current) => current.filter((p) => p.id !== id)), []);
  return { pulses, done };
}
