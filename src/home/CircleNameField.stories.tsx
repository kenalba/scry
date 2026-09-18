/* Copyright 2026 Element Creations Ltd.
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-Element-Commercial */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import { CircleNameField } from "./CircleNameField";
import { ScryShell } from "../scry/ScryShell";
import "../../theme-snapshot/wzrdz.css";
const meta = {
  title: "Scry/Circle name",
  component: CircleNameField,
  args: { placeholder: "Ken’s Circle" },
  decorators: [
    (Story) => (
      <ScryShell>
        <h1>Gather Around The Orb</h1>
        <Story />
        <button>Open</button>
      </ScryShell>
    ),
  ],
} satisfies Meta<typeof CircleNameField>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Constellation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      input = canvas.getByRole("textbox", { name: "name" });
    await userEvent.click(input);
    await userEvent.type(input, "Friday circle");
    await expect(input).toHaveValue("Friday circle");
    const label = canvasElement.querySelector("label")!;
    await expect(getComputedStyle(label).opacity).toBe("0");
    const stars = canvasElement.querySelectorAll("main i");
    await expect(stars).toHaveLength(5);
    await expect(getComputedStyle(stars[4]).animationDelay).toBe("0.56s");
    await userEvent.click(canvas.getByRole("button", { name: "Open" }));
    await waitFor(() => expect(getComputedStyle(stars[0]).opacity).toBe("0"), {
      timeout: 1500,
    });
  },
};

export const Summoning: Story = {
  args: { opening: true },
  play: async ({ canvasElement }) => {
    const circle = canvasElement.querySelector('[data-summoning="true"]')!;
    await expect(circle).toBeInTheDocument();
    await expect(
      getComputedStyle(circle.querySelector("path")!).animationDuration,
    ).toBe("0.6s");
  },
};
