"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { geometryChanged, heroLayout, type StageGeometry } from "@/lib/hero";
import { HeroCarve } from "./HeroCarve";
import { ShortenerCard } from "./ShortenerCard";
import { useShortener } from "./useShortener";
import styles from "./Stage.module.css";

/** The stage: hero lettering, the card, and the small readouts around it. */
export function Shortener({ domain }: { domain: string }) {
  const shortener = useShortener(domain);
  const stageRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const cutRef = useRef<SVGTextElement>(null);
  const [geo, setGeo] = useState<StageGeometry | null>(null);

  const measure = useCallback(() => {
    const stage = stageRef.current;
    const card = cardRef.current;
    if (!stage || !card) return;
    let cutWidth = 0;
    try {
      cutWidth = cutRef.current?.getComputedTextLength() ?? 0;
    } catch {
      // Not rendered (e.g. hidden on mobile); fall back to an estimate.
    }
    const next: StageGeometry = {
      width: stage.clientWidth,
      height: stage.clientHeight,
      cardX: card.offsetLeft,
      cardY: card.offsetTop,
      cardW: card.offsetWidth,
      cardH: card.offsetHeight,
      cutWidth,
    };
    setGeo((prev) => (geometryChanged(prev, next) ? next : prev));
  }, []);

  // Keep the carve glued to the card as either one changes size: results,
  // errors and the history list all make the card taller.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    const card = cardRef.current;
    if (!stage || !card) return;
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    observer.observe(card);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => observer.disconnect();
  }, [measure]);

  // CUT's width depends on the font size, which depends on the stage width,
  // so measure once more after a render at a new size.
  useLayoutEffect(measure, [measure, geo?.width]);

  const layout = geo && geo.width > 0 ? heroLayout(geo) : null;
  const { result: lastResult, history } = shortener;
  const saved = lastResult ? Math.max(0, lastResult.longUrl.length - lastResult.shortUrl.length) : null;

  return (
    <main id="top" ref={stageRef} className={styles.stage}>
      <h1 className="sr-only">Shortcut — shorten any link</h1>

      <span className={`${styles.corner} ${styles.tl}`} aria-hidden="true" />
      <span className={`${styles.corner} ${styles.tr}`} aria-hidden="true" />
      <span className={`${styles.corner} ${styles.bl}`} aria-hidden="true" />
      <span className={`${styles.corner} ${styles.br}`} aria-hidden="true" />

      <p className={styles.description}>
        Paste a long link and get a short one you can share anywhere. No account needed.
      </p>

      <dl className={styles.telemetry} aria-label="Your stats on this device">
        <div className={styles.telemetryRow}>
          <dt>Characters saved</dt>
          <dd className={`num ${styles.accentValue}`}>
            <span key={saved ?? "none"} className={styles.tick}>
              {saved === null ? "—" : saved}
            </span>
          </dd>
        </div>
        <div className={styles.telemetryRow}>
          <dt>Links on this device</dt>
          <dd className="num">
            <span key={history.length} className={styles.tick}>
              {history.length}
            </span>
          </dd>
        </div>
      </dl>

      <HeroCarve layout={layout} width={geo?.width ?? 0} height={geo?.height ?? 0} cutRef={cutRef} />

      {/* Mobile stacks the words above and below the card instead. */}
      <div className={styles.split} aria-hidden="true">
        <span className={`${styles.word} ${styles.wordShort} ${styles.inLeft}`}>
          <span>Short</span>
        </span>
        <span className={`${styles.word} ${styles.wordCut} ${styles.inRight}`}>
          <span>Cut</span>
        </span>
      </div>

      <ShortenerCard ref={cardRef} shortener={shortener} domain={domain} />
    </main>
  );
}
