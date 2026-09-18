/*
Copyright 2024 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE in the repository root for full details.
*/

import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { TooltipProvider } from "@vector-im/compound-web";

import { RoomHeaderInfo } from "./Header";

test.each([false, true])(
  "RoomHeaderInfo is accessible with hideAvatar=%s",
  async (hideAvatar) => {
    const { container } = render(
      <TooltipProvider>
        <RoomHeaderInfo
          hideAvatar={hideAvatar}
          id="!a:example.org"
          name="Mission Control"
          avatarUrl=""
          encrypted
          participantCount={11}
        />
      </TooltipProvider>,
    );
    expect(await axe(container)).toHaveNoViolations();
    // Check that the room name acts as a heading
    screen.getByRole("heading", { name: "Mission Control" });
  },
);
