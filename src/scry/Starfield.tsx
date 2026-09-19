import { type FC, type ReactNode, useSyncExternalStore } from "react";
import styles from "./Starfield.module.css";
import { StarfieldScene, useStarfieldClaim } from "./StarfieldScene";

const preferenceKey = "scry-stars-paused";
const preferenceEvent = "scry-stars-preference";
let memoryPaused = false;
function getPaused(): boolean {
  try {
    memoryPaused = localStorage.getItem(preferenceKey) === "true";
  } catch {
    /* In-memory preference remains available. */
  }
  return memoryPaused;
}
function subscribe(listener: () => void): () => void {
  window.addEventListener(preferenceEvent, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(preferenceEvent, listener);
    window.removeEventListener("storage", listener);
  };
}
function usePaused(): boolean {
  return useSyncExternalStore(subscribe, getPaused, () => false);
}

/** Decorative only; static for reduced motion/mobile. Control lives in the footer. */
export const Starfield: FC<{ fast?: boolean }> = ({ fast = false }) => {
  const paused = usePaused();
  const claimed = useStarfieldClaim(fast);
  if (claimed) return null;
  return (
    <div
      className="wzrdz-stars"
      data-paused={paused}
      data-fast={fast}
      aria-hidden="true"
    >
      <div />
      <div />
    </div>
  );
};

export const StarfieldToggle: FC<{ separator?: boolean }> = ({
  separator = false,
}) => {
  const paused = usePaused();
  return (
    <span className={styles.control}>
      {separator && <span aria-hidden="true"> · </span>}
      <button
        className="wzrdz-motion-toggle"
        type="button"
        aria-pressed={paused}
        onClick={() => {
          memoryPaused = !paused;
          try {
            localStorage.setItem(preferenceKey, String(memoryPaused));
          } catch {
            /* This page still remembers the preference. */
          }
          window.dispatchEvent(new Event(preferenceEvent));
        }}
      >
        {paused ? "Resume stars" : "stop the stars"}
      </button>
    </span>
  );
};

export const StarfieldProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const paused = usePaused();
  return <StarfieldScene paused={paused}>{children}</StarfieldScene>;
};
