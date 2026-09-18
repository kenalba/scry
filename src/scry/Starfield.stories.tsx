/* Copyright 2026 Element Creations Ltd.
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-Element-Commercial */
import { useState } from "react";
import { MemoryRouter } from "react-router-dom";
import { type Meta, type StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { Starfield, StarfieldProvider, StarfieldToggle } from "./Starfield";

function ArrivalStudy() {
  const [fast, setFast] = useState(true);
  return (
    <MemoryRouter>
      <>
        <link rel="stylesheet" href="https://wzrdz.cool/theme/v1/wzrdz.css" />
        <StarfieldProvider>
          <Starfield fast={fast} />
          <section
            style={{ minHeight: 500, padding: 32, color: "var(--wzrdz-fg)" }}
          >
            <h1>Gather Around The Orb</h1>
            <button className="wzrdz-button" onClick={() => setFast(!fast)}>
              {fast ? "Page ready" : "Replay loading"}
            </button>
            <footer>
              <StarfieldToggle />
            </footer>
          </section>
        </StarfieldProvider>
      </>
    </MemoryRouter>
  );
}
export default {
  title: "Scry/Arrival",
  component: ArrivalStudy,
} satisfies Meta<typeof ArrivalStudy>;
type Story = StoryObj<typeof ArrivalStudy>;
export const Loading: Story = {};
export const Ready: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Page ready" }));
    await expect(
      canvas.getByRole("button", { name: "Replay loading" }),
    ).toBeEnabled();
  },
};
export const Mobile: Story = { globals: { viewport: { value: "mobile2" } } };
