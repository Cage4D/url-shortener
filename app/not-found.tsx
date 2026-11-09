import type { Metadata } from "next";
import Link from "next/link";
import { PageFrame } from "@/components/SiteChrome";
import { TopoBackground } from "@/components/TopoBackground";
import styles from "./not-found.module.css";

export const metadata: Metadata = {
  title: "Link not found — Shortcut",
};

export default function NotFound() {
  return (
    <PageFrame backdrop={<TopoBackground />}>
      <main className={styles.stage}>
        <div className={styles.panel}>
          <p className={styles.code} aria-hidden="true">
            4<span>0</span>4
          </p>
          <h1 className={styles.title}>That short link doesn&rsquo;t exist</h1>
          <p className={styles.body}>It may have been mistyped, or it was never created.</p>
          <Link href="/" className={styles.cta}>
            Shorten a link
          </Link>
        </div>
      </main>
    </PageFrame>
  );
}
