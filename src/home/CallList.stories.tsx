/* SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-Element-Commercial */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { MemoryRouter } from "react-router-dom";
import { type MatrixClient } from "matrix-js-sdk";
import { CallList } from "./CallList";
import { type GroupCallRoom } from "./useGroupCallRooms";
import { ScryShell } from "../scry/ScryShell";
import "../../theme-snapshot/wzrdz.css";

const rooms = Array.from({ length: 24 }, (_, i) => ({
  roomName:
    i === 0
      ? "A very long circle name that should fit even on a small phone screen"
      : `Circle ${i + 1}`,
  room: { roomId: `!circle-${i}:example.org`, name: `Circle ${i + 1}` },
})) as GroupCallRoom[];
const meta = {
  title: "Scry/Circles",
  component: CallList,
  args: { rooms, client: {} as MatrixClient },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <ScryShell>
          <h1>Gather Around The Orb</h1>
          <Story />
        </ScryShell>
      </MemoryRouter>
    ),
  ],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof CallList>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Compact: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const history = canvas.getByRole("region", { name: "Your circles" });
    await expect(within(history).getAllByRole("link")).toHaveLength(5);
    await expect(history.scrollWidth).toBeLessThanOrEqual(history.clientWidth);
    const title = within(history).getByRole("heading");
    await expect(getComputedStyle(title).paddingTop).toBe("0px");
    await userEvent.type(canvas.getByRole("searchbox"), "Circle 24");
    await expect(within(history).getAllByRole("link")).toHaveLength(1);
    await expect(within(history).getByRole("link")).toHaveTextContent(
      "Circle 24",
    );
    await userEvent.clear(canvas.getByRole("searchbox"));
    await userEvent.click(
      canvas.getByRole("button", { name: "Show more (19)" }),
    );
    await expect(within(history).getAllByRole("link")).toHaveLength(10);
    await expect(history.scrollWidth).toBeLessThanOrEqual(history.clientWidth);
  },
};
export const Mobile: Story = {
  ...Compact,
  globals: { viewport: { value: "mobile1" } },
};
