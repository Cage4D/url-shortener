import type { ReactNode, TransitionEvent } from "react";
import styles from "./Collapse.module.css";

/**
 * Animates its height between 0 and its content's natural height, so the
 * things below it are pushed rather than jumping. Content stays mounted
 * (and inert) while closed so it can animate out.
 */
export function Collapse({
  open,
  children,
  className,
  onSettled,
}: {
  open: boolean;
  children: ReactNode;
  className?: string;
  /** Called when the open/close animation finishes. */
  onSettled?: () => void;
}) {
  const onTransitionEnd = (e: TransitionEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && e.propertyName === "grid-template-rows") onSettled?.();
  };
  return (
    <div
      className={`${styles.collapse} ${className ?? ""}`}
      data-open={open || undefined}
      inert={!open}
      onTransitionEnd={onSettled ? onTransitionEnd : undefined}
    >
      <div className={styles.inner}>{children}</div>
    </div>
  );
}
