/*
Copyright 2022-2024 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE in the repository root for full details.
*/

import { type FC, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { logger } from "matrix-js-sdk/lib/logger";
import { Button, Text } from "@vector-im/compound-web";

import styles from "./RoomAuthView.module.css";
import { ScryShell } from "../scry/ScryShell";
import scryStyles from "../scry/ScryShell.module.css";
import { startSsoLogin } from "../auth/scrySso";
import { FieldRow, InputField, ErrorMessage } from "../input/Input";
import { Form } from "../form/Form";
import { useRegisterPasswordlessUser } from "../auth/useRegisterPasswordlessUser";
import { useRoomIdentifier } from "../UrlParams";

export const RoomAuthView: FC = () => {
  const { roomAlias } = useRoomIdentifier();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();

  const { registerPasswordlessUser, recaptchaId } =
    useRegisterPasswordlessUser();

  const onSubmit = useCallback(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    (e) => {
      e.preventDefault();
      setLoading(true);

      const data = new FormData(e.target);
      const dataForDisplayName = data.get("displayName");
      const displayName =
        typeof dataForDisplayName === "string" ? dataForDisplayName : "";

      registerPasswordlessUser(displayName).catch((error) => {
        logger.error("Failed to register passwordless user", e);
        setLoading(false);
        setError(error);
      });
    },
    [registerPasswordlessUser],
  );

  const { t } = useTranslation();

  return (
    <ScryShell>
      <h1>Join the circle.</h1>
      {roomAlias && <p>{roomAlias.replace(/^#/, "").split(":")[0]}</p>}
      <p>
        Choose the name your friends will see. You’ll check your camera and
        microphone next.
      </p>
      <Form className={styles.form} onSubmit={onSubmit}>
        <FieldRow>
          <InputField
            id="displayName"
            name="displayName"
            label={t("common.display_name")}
            placeholder={t("common.display_name")}
            data-testid="joincall_displayName"
            type="text"
            required
            autoComplete="off"
          />
        </FieldRow>
        {error && (
          <FieldRow>
            <ErrorMessage error={error} />
          </FieldRow>
        )}
        <Button
          type="submit"
          size="lg"
          disabled={loading}
          data-testid="joincall_joincall"
        >
          {loading ? t("common.loading") : "Continue as guest"}
        </Button>
        <div id={recaptchaId} />
      </Form>
      <Text>Already one of the wzrdz?</Text>
      <button
        className={`${scryStyles.connect} wzrdz-button`}
        disabled={loading}
        onClick={() => {
          try {
            startSsoLogin();
          } catch {
            setError(
              new Error(
                "Sign-in needs browser storage. Enable it for Scry, then try again.",
              ),
            );
          }
        }}
      >
        connect
      </button>
    </ScryShell>
  );
};
