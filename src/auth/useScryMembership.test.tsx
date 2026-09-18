/*
Copyright 2026 Element Creations Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE in the repository root for full details.
*/

import { afterEach, expect, test, vi } from "vitest";
import { cleanup, render, renderHook, waitFor } from "@testing-library/react";
import { createClient } from "matrix-js-sdk";

import { ClientContextProvider, type ClientState } from "../ClientContext";
import {
  ScryMembershipProvider,
  useScryMembershipState,
  useScryMembership,
} from "./useScryMembership";

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

test("a restored session never renders guest presentation while its authority is pending", () => {
  vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));
  const client = createClient({
    baseUrl: "https://scry.example",
    accessToken: "restored-token",
  });
  const seen: string[] = [];
  const { rerender } = renderHook(
    ({ current }: { current?: typeof client }) => {
      const membership = useScryMembership(current);
      seen.push(membership);
      return membership;
    },
    { initialProps: { current: undefined as typeof client | undefined } },
  );
  seen.length = 0;
  rerender({ current: client });
  expect(seen).not.toContain("guest");
  expect(seen).toContain("loading");
});

test("returning home reuses the settled membership without another loading screen", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValue({
      ok: true,
      json: async () => ({ can_create_room: true }),
    });
  vi.stubGlobal("fetch", fetch);
  const client = createClient({
    baseUrl: "https://scry.example",
    accessToken: "session-token",
  });
  const clientState = {
    state: "valid",
    authenticated: { client },
  } as ClientState;
  const Home = () => <div>{useScryMembershipState()}</div>;
  const Page = ({ home }: { home: boolean }) => (
    <ClientContextProvider value={clientState}>
      <ScryMembershipProvider>
        {home ? <Home /> : <div>in circle</div>}
      </ScryMembershipProvider>
    </ClientContextProvider>
  );
  const result = render(<Page home />);
  await waitFor(() => expect(result.getByText("member")).toBeTruthy());
  result.rerender(<Page home={false} />);
  result.rerender(<Page home />);
  expect(result.getByText("member")).toBeTruthy();
  expect(result.queryByText("loading")).toBeNull();
  expect(fetch).toHaveBeenCalledTimes(1);
});
