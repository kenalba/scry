/* Copyright 2026 Element Creations Ltd.
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-Element-Commercial */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, within, waitFor } from "storybook/test";
import { StarfieldScene, useStarfieldClaim } from "./StarfieldScene";
import "../../theme-snapshot/wzrdz.css";
function Page({ loading }: { loading: boolean }) {
  useStarfieldClaim(loading);
  return <h1>{loading ? "Loading…" : "Gather Around The Orb"}</h1>;
}
function Arrival() {
  const [loading, setLoading] = useState(true);
  return (
    <StarfieldScene paused={false}>
      <Page loading={loading} />
      <button onClick={() => setLoading(false)}>Finish loading</button>
    </StarfieldScene>
  );
}
const meta = {
  title: "Scry/Arrival",
  component: Arrival,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Arrival>;
export default meta;
type Story = StoryObj<typeof meta>;
export const NoSecondFlash: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(canvasElement.querySelector(".wzrdz-rays")).toHaveAttribute(
        "data-active",
        "true",
      ),
    );
    const slow = canvasElement.querySelector(".wzrdz-slow")!;
    const slowAnimation = slow.querySelector("i")!.getAnimations()[0];
    await expect(getComputedStyle(slow).opacity).toBe("1");
    const cancel = Animation.prototype.cancel;
    const restoredOpacities: string[] = [];
    Animation.prototype.cancel = function () {
      const target = (this.effect as KeyframeEffect | null)?.target;
      const result = cancel.call(this);
      if (
        target instanceof HTMLElement &&
        target.classList.contains("wzrdz-rays")
      )
        restoredOpacities.push(getComputedStyle(target).opacity);
      return result;
    };
    try {
      await userEvent.click(
        canvas.getByRole("button", { name: "Finish loading" }),
      );
      await waitFor(
        () =>
          expect(canvasElement.querySelector(".wzrdz-rays")).toHaveAttribute(
            "data-active",
            "false",
          ),
        { timeout: 2000 },
      );
      await expect(restoredOpacities).toEqual(["0"]);
      await expect(slow.querySelector("i")!.getAnimations()[0]).toBe(
        slowAnimation,
      );
      await expect(getComputedStyle(slow).opacity).toBe("1");
      await expect(canvas.getByRole("heading")).toHaveTextContent(
        "Gather Around The Orb",
      );
    } finally {
      Animation.prototype.cancel = cancel;
    }
  },
};
