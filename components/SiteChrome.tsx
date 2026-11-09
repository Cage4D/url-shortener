import Link from "next/link";
import type { ReactNode } from "react";
import { siteConfig } from "@/lib/config";
import { ArrowUpRight } from "./icons";
import styles from "./chrome.module.css";

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.brand}>
        <span className={styles.wordmark}>Shortcut</span>
      </Link>
      <nav aria-label="Primary" className={styles.nav}>
        <a href={siteConfig.sourceUrl} className={styles.pill} target="_blank" rel="noopener noreferrer">
          Source
          <span className={styles.nudge}>
            <ArrowUpRight size={14} />
          </span>
        </a>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <span>© 2026 Shortcut</span>
      <span>{siteConfig.shortDomain}</span>
    </footer>
  );
}

/** Full-bleed page: header, a growing middle, footer. No outer container. */
export function PageFrame({ children, backdrop }: { children: ReactNode; backdrop?: ReactNode }) {
  return (
    <div className={styles.frame}>
      {backdrop}
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}
