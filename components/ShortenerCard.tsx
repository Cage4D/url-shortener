"use client";

import { useEffect, useRef, useState, type Ref } from "react";
import { Collapse } from "./Collapse";
import { AlertIcon, ArrowUpRight, CheckIcon, ChevronIcon, CopyIcon, LinkIcon, Spinner } from "./icons";
import type { Shortener } from "./useShortener";
import styles from "./ShortenerCard.module.css";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function ShortenerCard({
  shortener: s,
  domain,
  ref,
}: {
  shortener: Shortener;
  domain: string;
  ref?: Ref<HTMLElement>;
}) {
  const aliasInput = useRef<HTMLInputElement>(null);
  const urlInput = useRef<HTMLInputElement>(null);
  const panelsRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [listHasMore, setListHasMore] = useState(false);
  const [clearing, setClearing] = useState(false);
  const loading = s.status === "loading";
  const urlError = s.errorVisible && s.error?.field === "url";
  const aliasError = s.errorVisible && s.error?.field === "alias";
  const resultCopied = s.copied?.id === "result" && s.copied.ok;

  // Opening the alias field is a request to type in it.
  useEffect(() => {
    if (s.showAlias) aliasInput.current?.focus({ preventScroll: true });
  }, [s.showAlias]);

  // The list shows three rows and scrolls for the rest. Fade its bottom edge
  // while there's more below, since scrollbars are hidden site-wide.
  const updateListFade = () => {
    const el = listRef.current;
    if (el) setListHasMore(el.scrollTop + el.clientHeight < el.scrollHeight - 2);
  };

  // A new link lands at the top, so bring the list back there.
  const newest = s.history[0]?.slug;
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = 0;
    updateListFade();
  }, [newest, s.history.length]);

  // Let the list fold away first, then actually empty it.
  const clearHistory = () => setClearing(true);
  const onHistorySettled = () => {
    if (!clearing) return;
    s.clearHistory();
    setClearing(false);
  };

  // Show or hide the result and recent links together. When hiding, if
  // focus was inside them, hand it to the URL field instead of losing it.
  const togglePanels = () => {
    if (s.panelsOpen && panelsRef.current?.contains(document.activeElement)) {
      urlInput.current?.focus({ preventScroll: true });
    }
    s.togglePanels();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && s.panelsOpen && s.hasPanels) togglePanels();
  };

  const linkCount = s.history.length;
  const panelsLabel = s.panelsOpen
    ? "Hide links"
    : linkCount > 0
      ? `Show links · ${linkCount}`
      : "Show result";

  const announcement = s.errorVisible
    ? s.error?.message
    : s.resultVisible && s.status === "success"
      ? `Your short link is ready: ${domain}/${s.result?.slug}`
      : "";

  return (
    <section ref={ref} className={styles.card} aria-label="Shorten a link" onKeyDown={onKeyDown}>
      {/* The slant lives on this inner box, not the section: Chrome puts the
          section on its own GPU layer, and a skewed layer gets resampled,
          which blurs the (counter-skewed) text inside it. */}
      <div className={styles.surface}>
        <form onSubmit={s.submit} noValidate className={styles.form}>
          <label htmlFor="long-url" className="sr-only">
            Long URL
          </label>
          <div className={styles.field} data-invalid={urlError || undefined}>
            <span className={styles.fieldIcon}>
              <LinkIcon />
            </span>
            <input
              ref={urlInput}
              className={`up ${styles.urlInput}`}
              id="long-url"
              name="url"
              type="url"
              inputMode="url"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              placeholder="Paste a long link…"
              value={s.url}
              onChange={(e) => s.onUrlChange(e.target.value)}
              aria-invalid={urlError}
              aria-describedby={urlError ? "form-error" : undefined}
            />
            <button
              type="submit"
              className={styles.cta}
              disabled={loading}
              aria-busy={loading}
              data-loading={loading || undefined}
            >
              <span className={`up ${styles.ctaLabel}`}>
                <span className={styles.spinner} aria-hidden="true">
                  <Spinner />
                </span>
                {loading ? "Shortening…" : "Shorten"}
              </span>
            </button>
          </div>

          <Collapse open={s.showAlias}>
            <div className={`${styles.field} ${styles.aliasField}`} data-invalid={aliasError || undefined}>
              <label className={`up ${styles.aliasPrefix}`} htmlFor="alias">
                {domain}/
              </label>
              <input
                ref={aliasInput}
                className={`up ${styles.aliasInput}`}
                id="alias"
                name="alias"
                type="text"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                maxLength={32}
                placeholder="your-alias"
                value={s.alias}
                onChange={(e) => s.onAliasChange(e.target.value)}
                aria-invalid={aliasError}
                aria-describedby={aliasError ? "form-error" : undefined}
              />
            </div>
          </Collapse>

          <div className={styles.toolbar}>
            <button
              type="button"
              className={`up ${styles.toggle}`}
              onClick={s.toggleAlias}
              aria-expanded={s.showAlias}
              data-open={s.showAlias || undefined}
            >
              <span className={styles.plus} aria-hidden="true" />
              {s.showAlias ? "Remove custom alias" : "Custom alias"}
            </button>
            {s.hasPanels && (
              <button
                type="button"
                className={`up ${styles.panelsToggle}`}
                onClick={togglePanels}
                aria-expanded={s.panelsOpen}
                aria-controls="link-panels"
                data-closed={!s.panelsOpen || undefined}
              >
                <span key={panelsLabel} className={styles.panelsLabel}>
                  {panelsLabel}
                </span>
                <ChevronIcon />
              </button>
            )}
          </div>
        </form>

        {/* Screen readers hear changes here; the visual blocks below animate. */}
        <p className="sr-only" role="status" aria-live="polite">
          <span key={s.errorCount}>{announcement}</span>
        </p>

        <Collapse open={s.errorVisible}>
          <p id="form-error" className={styles.error}>
            <AlertIcon />
            <span key={s.errorCount} className={`up ${styles.errorText}`}>
              {s.error?.message}
            </span>
          </p>
        </Collapse>

        <div id="link-panels" ref={panelsRef}>
          <Collapse open={s.resultVisible}>
            {s.result && (
              <div className={styles.result}>
                <div className={styles.resultHead}>
                  <span className="up">Your short link is ready</span>
                  <span className={`up num ${styles.resultTime}`}>{formatTime(s.result.createdAt)}</span>
                </div>
                <div className={styles.resultRow}>
                  <a
                    key={s.result.slug}
                    className={`up ${styles.shortLink}`}
                    href={s.result.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className={styles.domain}>{domain}/</span>
                    <span className={styles.slug}>{s.result.slug}</span>
                  </a>
                  <div className={styles.resultActions}>
                    <a
                      href={s.result.shortUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.iconButton}
                      aria-label="Open short link in a new tab"
                    >
                      <span className={styles.nudge}>
                        <ArrowUpRight />
                      </span>
                    </a>
                    <button
                      type="button"
                      className={styles.copyButton}
                      onClick={() => s.copy(s.result!.shortUrl, "result")}
                      data-copied={resultCopied || undefined}
                    >
                      <span key={resultCopied ? "done" : "idle"} className={styles.copyIcon}>
                        {resultCopied ? <CheckIcon /> : <CopyIcon />}
                      </span>
                      <span className="up">{s.copyLabel("result")}</span>
                    </button>
                  </div>
                </div>
                <p className={`up ${styles.longUrl}`} title={s.result.longUrl}>
                  {s.result.longUrl}
                </p>
              </div>
            )}
          </Collapse>

          <Collapse open={s.historyVisible && !clearing} onSettled={onHistorySettled}>
            <div className={styles.history}>
              <div className={styles.historyHead}>
                <h2 className="up">
                  Recent links <span>saved in this browser</span>
                </h2>
                <button type="button" className={`up ${styles.clear}`} onClick={clearHistory}>
                  Clear
                </button>
              </div>
              <ul
              ref={listRef}
              className={styles.historyList}
              onScroll={updateListFade}
              data-more={listHasMore || undefined}
            >
                {s.history.map((item) => {
                  const id = `h:${item.slug}`;
                  const label = s.copyLabel(id);
                  return (
                    <li key={item.slug} className={styles.rowWrap}>
                      <div className={styles.row}>
                        <div className={`up ${styles.rowText}`}>
                          <span className={styles.rowShort}>
                            {domain}/{item.slug}
                          </span>
                          <span className={styles.rowLong} title={item.longUrl}>
                            {item.longUrl}
                          </span>
                        </div>
                        <button
                          type="button"
                          className={styles.rowCopy}
                          onClick={() => s.copy(item.shortUrl, id)}
                          aria-label={label === "Copy" ? `Copy ${domain}/${item.slug}` : label}
                          data-copied={(s.copied?.id === id && s.copied.ok) || undefined}
                        >
                          <span key={label} className={`up ${styles.rowCopyLabel}`}>
                            {label}
                          </span>
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </Collapse>
        </div>
      </div>
    </section>
  );
}
