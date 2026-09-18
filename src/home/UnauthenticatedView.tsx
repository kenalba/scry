import { type FC, useState } from "react";
import { startSsoLogin } from "../auth/scrySso";
import { ScryShell } from "../scry/ScryShell";
import styles from "../scry/ScryShell.module.css";

export const UnauthenticatedView: FC = () => {
  const [error, setError] = useState(false);
  return (
    <ScryShell>
      <h1>Gather Around The Orb</h1>
      <p>
        Sign in with your wzrdz.cool account to pierce the aether, then send
        your friends a link.
      </p>
      <button
        className={`${styles.connect} wzrdz-button`}
        onClick={() => {
          try {
            startSsoLogin("/");
          } catch {
            setError(true);
          }
        }}
      >
        connect
      </button>
      {error && (
        <p role="alert">
          Sign-in needs browser storage. Enable it for Scry, then try again.
        </p>
      )}
    </ScryShell>
  );
};
