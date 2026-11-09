"use client";

import { useEffect, useRef, type Ref } from "react";
import { AlertIcon, ArrowUpRight, CheckIcon, CopyIcon, LinkIcon } from "./icons";
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
  const loading = s.status === "loading";
  const urlError = s.error?.field === "url";
  const aliasError = s.error?.field === "alias";

  // Opening the alias field is a request to type in it.
  useEffect(() => {
    if (s.showAlias) aliasInput.current?.focus();
  }, [s.showAlias]);

  return (
    <section ref={ref} className={styles.card} aria-label="Shorten a link">
      <form onSubmit={s.submit} noValidate className={styles.form}>
        <label htmlFor="long-url" className="sr-only">
          Long URL
        </label>
        <div className={styles.field} data-invalid={urlError || undefined}>
          <span className={styles.fieldIcon}>
            <LinkIcon />
          </span>
          <input
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
            aria-describedby="form-msg"
          />
          <button type="submit" className={styles.cta} disabled={loading} aria-busy={loading}>
            <span className="up">{loading ? "Shortening…" : "Shorten"}</span>
          </button>
        </div>

        {s.showAlias && (
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
              aria-describedby="form-msg"
            />
          </div>
        )}

        <div className={styles.toolbar}>
          <button type="button" className={`up ${styles.toggle}`} onClick={s.toggleAlias} aria-expanded={s.showAlias}>
            <span className={styles.toggleGlyph} aria-hidden="true">
              {s.showAlias ? "−" : "+"}
            </span>
            {s.showAlias ? "Remove custom alias" : "Custom alias"}
          </button>
        </div>
      </form>

      <div id="form-msg" role="status" aria-live="polite">
        {s.status === "error" && s.error && (
          <p className={styles.error}>
            <AlertIcon />
            <span className="up">{s.error.message}</span>
          </p>
        )}

        {s.result && (
          <div className={styles.result}>
            <div className={styles.resultHead}>
              <span className="up">Your short link is ready</span>
              <span className={`up num ${styles.resultTime}`}>{formatTime(s.result.createdAt)}</span>
            </div>
            <div className={styles.resultRow}>
              <a
                className={`up ${styles.shortLink}`}
                href={s.result.shortUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className={styles.domain}>{domain}/</span>
                {s.result.slug}
              </a>
              <div className={styles.resultActions}>
                <a
                  href={s.result.shortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.iconButton}
                  aria-label="Open short link in a new tab"
                >
                  <ArrowUpRight />
                </a>
                <button
                  type="button"
                  className={styles.copyButton}
                  onClick={() => s.copy(s.result!.shortUrl, "result")}
                >
                  {s.copied?.id === "result" && s.copied.ok ? <CheckIcon /> : <CopyIcon />}
                  <span className="up">{s.copyLabel("result")}</span>
                </button>
              </div>
            </div>
            <p className={`up ${styles.longUrl}`} title={s.result.longUrl}>
              {s.result.longUrl}
            </p>
          </div>
        )}
      </div>

      {s.history.length > 0 && (
        <div className={styles.history}>
          <div className={styles.historyHead}>
            <h2 className="up">
              Recent links <span>saved in this browser</span>
            </h2>
            <button type="button" className={`up ${styles.clear}`} onClick={s.clearHistory}>
              Clear
            </button>
          </div>
          <ul className={styles.historyList}>
            {s.history.map((item) => {
              const id = `h:${item.slug}`;
              return (
                <li key={item.slug} className={styles.row}>
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
                    aria-label={s.copied?.id === id ? s.copyLabel(id) : `Copy ${domain}/${item.slug}`}
                  >
                    <span className="up">{s.copyLabel(id)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
