import { PageFrame } from "@/components/SiteChrome";
import styles from "./page.module.css";

export default function Home() {
  return (
    <PageFrame>
      <main id="top" className={styles.stage}>
        <h1 className="sr-only">Shortcut — shorten any link</h1>
      </main>
    </PageFrame>
  );
}
