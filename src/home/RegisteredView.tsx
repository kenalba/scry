/*
Copyright 2022-2024 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE in the repository root for full details.
*/

import {
  useState,
  useCallback,
  type FormEvent,
  type FormEventHandler,
  type FC,
} from "react";
import { type MatrixClient } from "matrix-js-sdk";
import { useTranslation } from "react-i18next";
import { Text } from "@vector-im/compound-web";
import { logger } from "matrix-js-sdk/lib/logger";
import { useNavigate } from "react-router-dom";

import {
  createRoom,
  getRelativeRoomUrl,
  roomAliasLocalpartFromRoomName,
  sanitiseRoomNameInput,
} from "../utils/matrix";
import { useGroupCallRooms } from "./useGroupCallRooms";
import { ScryShell } from "../scry/ScryShell";
import styles from "./RegisteredView.module.css";
import { FieldRow, InputField, ErrorMessage } from "../input/Input";
import { CallList } from "./CallList";
import { UserMenuContainer } from "../UserMenuContainer";
import { JoinExistingCallModal } from "./JoinExistingCallModal";
import { Form } from "../form/Form";
import { AnalyticsNotice } from "../analytics/AnalyticsNotice";
import { E2eeType } from "../e2ee/e2eeType";
import { useProfile } from "../profile/useProfile";
import scryStyles from "../scry/ScryShell.module.css";
import { useOptInAnalytics } from "../settings/settings";

interface Props {
  client: MatrixClient;
}

export const RegisteredView: FC<Props> = ({ client }) => {
  const { displayName } = useProfile(client);
  const profileName = displayName?.trim() || client.getUserIdLocalpart();
  const circlePlaceholder = profileName
    ? `${profileName}’s Circle`
    : "My Circle";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();
  const [optInAnalytics] = useOptInAnalytics();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [joinExistingCallModalOpen, setJoinExistingCallModalOpen] =
    useState(false);
  const onDismissJoinExistingCallModal = useCallback(
    () => setJoinExistingCallModalOpen(false),
    [setJoinExistingCallModalOpen],
  );

  const onSubmit: FormEventHandler<HTMLFormElement> = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const data = new FormData(e.target as HTMLFormElement);
      const roomNameData = data.get("callName");
      const roomName =
        typeof roomNameData === "string"
          ? sanitiseRoomNameInput(
              roomNameData.trim() ? roomNameData : circlePlaceholder,
            )
          : circlePlaceholder;

      async function submit(): Promise<void> {
        setError(undefined);
        setLoading(true);

        const createRoomResult = await createRoom(
          client,
          roomName,
          E2eeType.SHARED_KEY,
        );
        if (!createRoomResult.password)
          throw new Error("Failed to create room with shared secret");

        await navigate(
          getRelativeRoomUrl(
            createRoomResult.roomId,
            { kind: E2eeType.SHARED_KEY, secret: createRoomResult.password },
            roomName,
          ),
        );
      }

      submit().catch((error) => {
        if (error.errcode === "M_ROOM_IN_USE") {
          setExistingAlias(roomAliasLocalpartFromRoomName(roomName));
          setLoading(false);
          setError(undefined);
          setJoinExistingCallModalOpen(true);
        } else {
          logger.error(error);
          setLoading(false);
          setError(error);
        }
      });
    },
    [client, navigate, setJoinExistingCallModalOpen, circlePlaceholder],
  );

  const recentRooms = useGroupCallRooms(client);

  const [existingAlias, setExistingAlias] = useState<string>();
  const onJoinExistingRoom = useCallback(() => {
    navigate(`/${existingAlias}`)?.catch((error) => {
      logger.error("Failed to navigate to existing alias", error);
    });
  }, [navigate, existingAlias]);

  return (
    <>
      <ScryShell headerActions={<UserMenuContainer />}>
        <h1>Gather Around The Orb</h1>
        <p>Open a circle and summon your friends.</p>
        <Form className={styles.form} onSubmit={onSubmit}>
          <FieldRow className={styles.fieldRow}>
            <InputField
              id="callName"
              name="callName"
              label="name"
              className={styles.nameField}
              placeholder={circlePlaceholder}
              type="text"
              autoComplete="off"
              data-testid="home_callName"
            />

            <button
              type="submit"
              className={`${styles.button} ${scryStyles.connect} wzrdz-button`}
              disabled={loading}
              data-testid="home_go"
            >
              {loading ? t("common.loading") : "Open"}
            </button>
          </FieldRow>
          {optInAnalytics === null && (
            <Text size="sm" className={styles.notice}>
              <AnalyticsNotice />
            </Text>
          )}
          {error && (
            <FieldRow className={styles.fieldRow}>
              <ErrorMessage error={error} />
            </FieldRow>
          )}
        </Form>
        {recentRooms.length > 0 && (
          <CallList rooms={recentRooms} client={client} />
        )}
      </ScryShell>
      <JoinExistingCallModal
        onJoin={onJoinExistingRoom}
        open={joinExistingCallModalOpen}
        onDismiss={onDismissJoinExistingCallModal}
      />
    </>
  );
};
