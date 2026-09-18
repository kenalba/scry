/*
Copyright 2026 Element Creations Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE in the repository root for full details.
*/
import { type ReactNode } from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { LoginPage } from "./LoginPage";

const mocks = vi.hoisted(() => ({ complete: vi.fn(), setClient: vi.fn(), start: vi.fn() }));
vi.mock("../ClientContext", () => ({
  useClient: () => ({ client: undefined, setClient: mocks.setClient }),
  useClientState: () => ({ state: "valid" }),
}));
vi.mock("./scrySso", () => ({ completeSsoLogin: mocks.complete, startSsoLogin: mocks.start }));
vi.mock("./scrySsoBootstrap", () => ({ ssoCallback: { token: "test-token", returnTo: "/" } }));
vi.mock("../usePageTitle", () => ({ usePageTitle: () => undefined }));
vi.mock("../FullScreenView", () => ({ LoadingPage: () => <div role="status">Loading Scry</div> }));
vi.mock("../scry/ScryShell", () => ({ ScryShell: ({ children }: { children: ReactNode }) => <main>{children}</main> }));
vi.mock("../input/Input", () => ({
  FieldRow: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  ErrorMessage: ({ error }: { error: Error }) => <p role="alert">{error.message}</p>,
}));
vi.mock("../button/Link", () => ({ Link: ({ children }: { children: ReactNode }) => <span>{children}</span> }));

beforeEach(() => vi.resetAllMocks());
afterEach(cleanup);

test("callback shows only loading until exchange completes, then returns home", async () => {
  let finish!: (value: unknown[]) => void;
  mocks.complete.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
  render(<MemoryRouter initialEntries={["/sso/callback"]}><Routes>
    <Route path="/sso/callback" element={<LoginPage />} />
    <Route path="/" element={<h1>Circle home</h1>} />
  </Routes></MemoryRouter>);
  expect(screen.getByRole("status")).toHaveTextContent("Loading Scry");
  expect(screen.queryByRole("button")).toBeNull();
  expect(mocks.complete).toHaveBeenCalledTimes(1);
  finish([{}, {}]);
  await screen.findByRole("heading", { name: "Circle home" });
  expect(mocks.setClient).toHaveBeenCalledTimes(1);
});

test("failed exchange exits loading and offers retry", async () => {
  mocks.complete.mockRejectedValue(new Error("failure"));
  render(<MemoryRouter initialEntries={["/sso/callback"]}><LoginPage /></MemoryRouter>);
  await screen.findByRole("alert");
  await waitFor(() => expect(screen.queryByRole("status")).toBeNull());
  expect(screen.getByRole("button")).not.toBeDisabled();
  expect(mocks.setClient).not.toHaveBeenCalled();
});
