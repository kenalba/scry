/*
Copyright 2026 Element Creations Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE in the repository root for full details.
*/

import { MemoryRouter } from "react-router-dom";
import { expect, fn, within } from "storybook/test";
import { type Meta, type StoryObj } from "@storybook/react-vite";
import { LoginPage } from "./LoginPage";
import { ClientContextProvider } from "../ClientContext";

const meta = {
  title: "Scry/Sign in",
  component: LoginPage,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <ClientContextProvider
          value={{
            state: "valid",
            disconnected: false,
            supportedFeatures: { reactions: true },
            setClient: fn(),
          }}
        >
          <Story />
        </ClientContextProvider>
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof LoginPage>;
export default meta;
type Story = StoryObj<typeof meta>;

export const MemberSignIn: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("button", { name: "Sign in with wzrdz.cool" }),
    ).toBeEnabled();
    await expect(canvas.getByText(/Open your meeting link/)).toBeVisible();
    await expect(canvas.queryByLabelText("Password")).not.toBeInTheDocument();
  },
};
export const Mobile: Story = {
  ...MemberSignIn,
  globals: { viewport: { value: "mobile2" } },
};
