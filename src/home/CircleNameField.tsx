/* Copyright 2026 Element Creations Ltd.
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-Element-Commercial */
import { useEffect, useRef, useState } from "react";
import { InputField } from "../input/Input";
import styles from "./CircleNameField.module.css";

export function CircleNameField({
  placeholder,
  opening = false,
}: {
  placeholder: string;
  opening?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const [tracing, setTracing] = useState(false);
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  useEffect(() => () => clearTimeout(fadeTimer.current), []);
  return (
    <div
      className={styles.field}
      onFocus={() => {
        clearTimeout(fadeTimer.current);
        setTracing(true);
        setFocused(true);
      }}
      onBlur={(event) => {
        if (event.currentTarget.contains(event.relatedTarget)) return;
        setFocused(false);
        fadeTimer.current = setTimeout(() => setTracing(false), 650);
      }}
    >
      <div
        className={[
          styles.constellation,
          tracing ? styles.tracing : "",
          focused || opening ? styles.lit : "",
          opening ? styles.summoning : "",
        ].join(" ")}
        aria-hidden="true"
        data-summoning={opening}
      >
        <svg viewBox="0 0 100 100" preserveAspectRatio="none">
          <path pathLength="1" d="M0 100 L50 0 L100 100 L0 0 L100 0 Z" />
        </svg>
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
      <InputField
        id="callName"
        name="callName"
        label="name"
        type="text"
        autoComplete="off"
        className={styles.input}
        placeholder={placeholder}
        data-testid="home_callName"
      />
    </div>
  );
}
