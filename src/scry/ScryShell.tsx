import { type FC, type ReactNode, type MouseEventHandler } from "react";
import { Starfield, StarfieldToggle } from "./Starfield";
import styles from "./ScryShell.module.css";

export const ScryOrb: FC = () => (
  <img
    src="https://wzrdz.cool/theme/v1/orb.svg"
    width="64"
    height="64"
    alt=""
    aria-hidden="true"
  />
);

export const ScryWordmark: FC<{
  onHomeClick?: MouseEventHandler<HTMLAnchorElement>;
}> = ({ onHomeClick }) => (
  <span className={styles.brand}>
    <a href="/" onClick={onHomeClick} aria-label="Scry home">
      <ScryOrb />
      <span>scry</span>
    </a>
    <span aria-hidden="true">.</span>
    <a href="https://wzrdz.cool" target="_blank" rel="noreferrer">
      wzrdz.cool
    </a>
  </span>
);

export const ScryShell: FC<{
  children: ReactNode;
  headerActions?: ReactNode;
  decoration?: ReactNode;
}> = ({ children, headerActions, decoration }) => (
  <div className={styles.shell}>
    <Starfield />
    <header className={styles.header}>
      <ScryWordmark />
      {headerActions && (
        <div className={styles.headerActions}>{headerActions}</div>
      )}
    </header>
    <main className={styles.main} data-scry-reveal>
      {decoration}
      {children}
    </main>
    <footer className={styles.footer}>
      <span>
        Powered by{" "}
        <a
          className={styles.attribution}
          href="https://github.com/element-hq/element-call/tree/main/docs"
          target="_blank"
          rel="noreferrer"
        >
          the elements
        </a>{" "}
        ·{" "}
        <a
          href="https://github.com/kenalba/scry/tree/signal25"
          target="_blank"
          rel="noreferrer"
        >
          source
        </a>
        <StarfieldToggle separator />
      </span>
    </footer>
  </div>
);
