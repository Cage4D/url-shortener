import Link from "next/link";
import type { ReactNode } from "react";
import { siteConfig } from "@/lib/config";
import styles from "./chrome.module.css";

export function ArrowUpRight({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  );
}

function LogoMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="22" height="22" rx="7" stroke="var(--fg)" strokeOpacity="0.35" />
      <path d="M8 16 16 8" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.brand}>
        <LogoMark />
        <span className={styles.wordmark}>Shortcut</span>
      </Link>
      <nav aria-label="Primary" className={styles.nav}>
        <a href={siteConfig.sourceUrl} className={styles.pill} target="_blank" rel="noopener noreferrer">
          Source
          <ArrowUpRight />
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
