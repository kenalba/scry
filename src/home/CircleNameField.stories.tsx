/* Copyright 2026 Element Creations Ltd.
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-Element-Commercial */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import { useState } from "react";
import { CircleNameField } from "./CircleNameField";
import { SummoningStars } from "./SummoningStars";
import { ScryShell } from "../scry/ScryShell";
import "../../theme-snapshot/wzrdz.css";
function Panel() {
  const [focused, setFocused] = useState(false),
    [opening, setOpening] = useState(false);
  return (
    <ScryShell
      decoration={<SummoningStars focused={focused} opening={opening} />}
    >
      <h1>Gather Around The Orb</h1>
      <CircleNameField placeholder="Ken’s Circle" onFocusChange={setFocused} />
      <button onClick={() => setOpening(true)}>Open</button>
    </ScryShell>
  );
}
const meta = { title: "Scry/Circle name", component: Panel } satisfies Meta<
  typeof Panel
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const PanelStars: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      input = canvas.getByRole("textbox", { name: "name" });
    await userEvent.click(input);
    await userEvent.type(input, "Friday circle");
    await expect(input).toHaveValue("Friday circle");
    await expect(
      getComputedStyle(canvasElement.querySelector("label")!).opacity,
    ).toBe("0");
    const ornament = canvasElement.querySelector("[data-summoning]")!;
    await expect(ornament.querySelector("svg")).toBeNull();
    const panel = canvasElement.querySelector("main")!.getBoundingClientRect(),
      bounds = ornament.getBoundingClientRect();
    await expect(bounds.left).toBeLessThan(panel.left);
    await expect(bounds.top).toBeLessThan(panel.top);
    await expect(bounds.right).toBeGreaterThan(panel.right);
    await expect(bounds.bottom).toBeGreaterThan(panel.bottom);
    await userEvent.click(canvas.getByRole("heading"));
    await waitFor(() => expect(getComputedStyle(ornament).opacity).toBe("0"), {
      timeout: 1500,
    });
    await userEvent.click(canvas.getByRole("button", { name: "Open" }));
    await expect(ornament).toHaveAttribute("data-summoning", "true");
    await expect(
      getComputedStyle(ornament.querySelector("i")!).animationDuration,
    ).toBe("0.6s");
  },
};
export const Mobile: Story = {
  ...PanelStars,
  globals: { viewport: { value: "mobile1" } },
};
