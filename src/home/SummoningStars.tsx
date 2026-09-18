/* Copyright 2026 Element Creations Ltd.
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-Element-Commercial */
import { useEffect, useState } from "react";
import styles from "./SummoningStars.module.css";
/** Decorative stars belong to the entire panel, never the input's contents. */
export function SummoningStars({
  focused,
  opening,
}: {
  focused: boolean;
  opening: boolean;
}) {
  const [appeared, setAppeared] = useState(false);
  useEffect(() => {
    if (focused) {
      setAppeared(true);
      return;
    }
    const timer = setTimeout(() => setAppeared(false), 650);
    return () => clearTimeout(timer);
  }, [focused]);
  return (
    <div
      className={[
        styles.stars,
        appeared ? styles.appeared : "",
        focused || opening ? styles.lit : "",
        opening ? styles.summoning : "",
      ].join(" ")}
      aria-hidden="true"
      data-summoning={opening}
    >
      <i />
      <i />
      <i />
      <i />
      <i />
    </div>
  );
}
