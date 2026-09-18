/*
Copyright 2026 Element Creations Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE in the repository root for full details.
*/

import { afterEach, expect, test, vi } from "vitest";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { createClient } from "matrix-js-sdk";

import { useScryMembership } from "./useScryMembership";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test("visitors without a session are guests without a lookup", () => {
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  const { result } = renderHook(() => useScryMembership());
  expect(result.current).toBe("guest");
  expect(fetch).not.toHaveBeenCalled();
});

test.each([
  [{ can_create_room: true }, "member"],
  [{ can_create_room: false }, "guest"],
  [{ can_create_room: "true" }, "guest"],
  [{}, "guest"],
  [null, "guest"],
])(
  "only explicit authorization grants member presentation: %j",
  async (body, expected) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => body,
      }),
    );
    const client = createClient({
      baseUrl: "https://scry.example",
      accessToken: "test-token",
    });
    const { result } = renderHook(() => useScryMembership(client));
    await waitFor(() => expect(result.current).toBe(expected));
  },
);

test("failed membership checks never grant member presentation", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
  const client = createClient({
    baseUrl: "https://scry.example",
    accessToken: "test-token",
  });
  const { result } = renderHook(() => useScryMembership(client));
  await waitFor(() => expect(result.current).toBe("error"));
});

test("unmount cancels the authenticated lookup", () => {
  const fetch = vi.fn().mockReturnValue(new Promise(() => {}));
  vi.stubGlobal("fetch", fetch);
  const client = createClient({
    baseUrl: "https://scry.example",
    accessToken: "test-token",
  });
  const { unmount } = renderHook(() => useScryMembership(client));
  expect(fetch).toHaveBeenCalledWith(
    "https://scry.example/_synapse/client/scry/member",
    expect.objectContaining({
      headers: { Authorization: "Bearer test-token" },
      cache: "no-store",
    }),
  );
  const signal = fetch.mock.calls[0][1].signal as AbortSignal;
  expect(signal.aborted).toBe(false);
  unmount();
  expect(signal.aborted).toBe(true);
});
