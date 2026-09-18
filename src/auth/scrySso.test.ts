/*
Copyright 2026 Element Creations Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE in the repository root for full details.
*/

import { beforeEach, expect, it, vi } from "vitest";
import { type MatrixClient } from "matrix-js-sdk";
import { completeSsoLogin } from "./scrySso";

const mocks = vi.hoisted(() => ({ login: vi.fn(), initClient: vi.fn() }));
vi.mock("matrix-js-sdk", () => ({
  createClient: () => ({ login: mocks.login }),
}));
vi.mock("../utils/matrix", () => ({ initClient: mocks.initClient }));
vi.mock("../config/Config", () => ({
  Config: { defaultHomeserverUrl: () => "https://scry.wzrdz.cool" },
}));

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
});

it("leaves the guest session intact if token exchange fails", async () => {
  const logout = vi.fn();
  localStorage.setItem("matrix-auth-store", "guest-session");
  mocks.login.mockRejectedValue(new Error("expired"));
  await expect(
    completeSsoLogin("bad", { logout } as unknown as MatrixClient),
  ).rejects.toThrow();
  expect(logout).not.toHaveBeenCalled();
  expect(localStorage.getItem("matrix-auth-store")).toBe("guest-session");
  expect(mocks.initClient).not.toHaveBeenCalled();
});

it("exchanges the token before retiring guest and resetting crypto for member", async () => {
  const order: string[] = [];
  mocks.login.mockImplementation(async () => {
    order.push("exchange");
    return await Promise.resolve({
      user_id: "@member:scry.wzrdz.cool",
      access_token: "member-token",
      device_id: "MEMBER",
    });
  });
  const logout = vi.fn(async () => {
    order.push("logout guest");
    return await Promise.resolve();
  });
  const stopClient = vi.fn(() => {
    order.push("stop guest");
  });
  const memberClient = {};
  mocks.initClient.mockImplementation(async () => {
    order.push("init member");
    return await Promise.resolve(memberClient);
  });
  const [client, session] = await completeSsoLogin("single-use", {
    logout,
    stopClient,
  } as unknown as MatrixClient);
  expect(order).toEqual([
    "exchange",
    "logout guest",
    "stop guest",
    "init member",
  ]);
  expect(client).toBe(memberClient);
  expect(session.passwordlessUser).toBe(false);
  expect(mocks.initClient).toHaveBeenCalledWith(
    expect.objectContaining({
      userId: "@member:scry.wzrdz.cool",
      accessToken: "member-token",
    }),
    false,
  );
});

it("continues member login when the old guest token has expired", async () => {
  mocks.login.mockResolvedValue({
    user_id: "@member:scry.wzrdz.cool",
    access_token: "member-token",
    device_id: "MEMBER",
  });
  const logout = vi.fn().mockRejectedValue(new Error("M_UNKNOWN_TOKEN"));
  const stopClient = vi.fn();
  localStorage.setItem("matrix-auth-store", "guest-session");
  await completeSsoLogin("single-use", {
    logout,
    stopClient,
  } as unknown as MatrixClient);
  expect(stopClient).toHaveBeenCalledOnce();
  expect(localStorage.getItem("matrix-auth-store")).toBeNull();
  expect(mocks.initClient).toHaveBeenCalledOnce();
});
