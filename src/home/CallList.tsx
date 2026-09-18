/*
Copyright 2022-2024 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE in the repository root for full details.
*/

import { Link } from "react-router-dom";
import { type RoomMember, type Room, type MatrixClient } from "matrix-js-sdk";
import { type FC, useCallback, type MouseEvent, useState } from "react";
import { IconButton, Text } from "@vector-im/compound-web";
import { CloseIcon } from "@vector-im/compound-design-tokens/assets/web/icons";
import classNames from "classnames";

import { Avatar, Size } from "../Avatar";
import styles from "./CallList.module.css";
import { getRelativeRoomUrl } from "../utils/matrix";
import { type GroupCallRoom } from "./useGroupCallRooms";
import { useRoomEncryptionSystem } from "../e2ee/sharedKeyManagement";

export interface CallListProps {
  rooms: GroupCallRoom[];
  client: MatrixClient;
}

export const CallList: FC<CallListProps> = ({ rooms, client }) => {
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(5);
  const filtered = rooms.filter(({ roomName }) =>
    roomName.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  );
  return (
    <section className={styles.history} aria-label="Your circles">
      <div className={styles.listHeader}>
        <h2>Your circles</h2>
        {rooms.length > 5 && (
          <input
            type="search"
            aria-label="Find a circle"
            placeholder="Find a circle"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setLimit(5);
            }}
          />
        )}
      </div>
      <div className={styles.callList}>
        {filtered
          .slice(0, limit)
          .map(({ room, roomName, avatarUrl, participants }) => (
            <CallTile
              key={room.roomId}
              client={client}
              name={roomName}
              avatarUrl={avatarUrl}
              room={room}
              participants={participants}
            />
          ))}
      </div>
      {filtered.length === 0 && (
        <p className={styles.empty}>No matching circles.</p>
      )}
      {filtered.length > limit && (
        <button
          className={styles.showMore}
          onClick={() => setLimit((value) => value + 5)}
        >
          Show more ({filtered.length - limit})
        </button>
      )}
    </section>
  );
};
interface CallTileProps {
  name: string;
  avatarUrl: string;
  room: Room;
  participants: RoomMember[];
  client: MatrixClient;
}

const CallTile: FC<CallTileProps> = ({ name, avatarUrl, room, client }) => {
  const roomEncryptionSystem = useRoomEncryptionSystem(room.roomId);
  const [isLeaving, setIsLeaving] = useState(false);

  const onRemove = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setIsLeaving(true);
      client.leave(room.roomId).catch(() => setIsLeaving(false));
    },
    [room, client],
  );

  const body = (
    <>
      <Avatar id={room.roomId} name={name} size={Size.SM} src={avatarUrl} />
      <div className={styles.callInfo}>
        <Text weight="semibold" className={styles.callName}>
          {name}
        </Text>
      </div>
    </>
  );

  return (
    <div className={styles.callTile}>
      {isLeaving ? (
        <span className={classNames(styles.callTileLink, styles.disabled)}>
          {body}
        </span>
      ) : (
        <Link
          to={getRelativeRoomUrl(room.roomId, roomEncryptionSystem, room.name)}
          className={styles.callTileLink}
        >
          {body}
        </Link>
      )}
      <IconButton
        onClick={onRemove}
        disabled={isLeaving}
        aria-label={`Leave ${name}`}
      >
        <CloseIcon />
      </IconButton>
    </div>
  );
};
