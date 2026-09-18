/*
Copyright 2022-2024 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE in the repository root for full details.
*/

import { fireEvent, render, type RenderResult } from "@testing-library/react";
import { type MatrixClient } from "matrix-js-sdk";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { CallList } from "../../src/home/CallList";
import { type GroupCallRoom } from "../../src/home/useGroupCallRooms";

describe("CallList", () => {
  const renderComponent = (rooms: GroupCallRoom[]): RenderResult => {
    return render(
      <MemoryRouter>
        <CallList client={{} as MatrixClient} rooms={rooms} />
      </MemoryRouter>,
    );
  };

  it("should show room", () => {
    const rooms = [
      {
        roomName: "Room #1",
        roomAlias: "#room-name:server.org",
        room: {
          roomId: "!roomId",
        },
      },
    ] as GroupCallRoom[];

    const result = renderComponent(rooms);

    expect(result.queryByText("Room #1")).toBeTruthy();
  });
  it("bounds a long history and searches beyond the initial five", () => {
    const rooms = Array.from({ length: 24 }, (_, i) => ({
      roomName: `Circle ${i + 1}`,
      room: { roomId: `!room-${i}`, name: `Circle ${i + 1}` },
    })) as GroupCallRoom[];
    const result = renderComponent(rooms);
    expect(result.getAllByRole("link")).toHaveLength(5);
    fireEvent.click(result.getByRole("button", { name: "Show more (19)" }));
    expect(result.getAllByRole("link")).toHaveLength(10);
    fireEvent.change(result.getByRole("searchbox"), {
      target: { value: "circle 24" },
    });
    expect(result.getAllByRole("link")).toHaveLength(1);
    expect(result.getByRole("link").textContent).toContain("Circle 24");
    expect(
      result.getByRole("button", { name: "Leave Circle 24" }).closest("a"),
    ).toBeNull();
    fireEvent.change(result.getByRole("searchbox"), {
      target: { value: "missing" },
    });
    expect(result.getByText("No matching circles.")).toBeTruthy();
  });
});
