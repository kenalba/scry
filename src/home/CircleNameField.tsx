/* Copyright 2026 Element Creations Ltd.
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-Element-Commercial */
import { InputField } from "../input/Input";
import styles from "./CircleNameField.module.css";
export function CircleNameField({
  placeholder,
  onFocusChange,
}: {
  placeholder: string;
  onFocusChange?: (focused: boolean) => void;
}) {
  return (
    <div
      className={styles.field}
      onFocus={() => onFocusChange?.(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          onFocusChange?.(false);
      }}
    >
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
