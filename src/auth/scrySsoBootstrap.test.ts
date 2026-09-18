/*
Copyright 2026 Element Creations Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE in the repository root for full details.
*/

import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { prepareSso } from "./scrySsoState";

beforeEach(() => {
  vi.resetModules();
  sessionStorage.clear();
});
afterEach(() => history.replaceState(null, "", "/"));

it("removes callback credentials before exposing the verified result", async () => {
  const callback = prepareSso(
    sessionStorage,
    location.origin,
    "/room/#/call?password=secret",
    "nonce",
  );
  history.replaceState(null, "", callback + "&loginToken=single-use");
  const { ssoCallback } = await import("./scrySsoBootstrap");
  expect(location.pathname).toBe("/sso/callback");
  expect(location.search).toBe("");
  expect(ssoCallback).toEqual({
    token: "single-use",
    returnTo: "/room/#/call?password=secret",
  });
});

it("scrubs unsolicited tokens even when state verification fails", async () => {
  history.replaceState(
    null,
    "",
    "/sso/callback?loginToken=unsolicited&state=bad",
  );
  const { ssoCallback } = await import("./scrySsoBootstrap");
  expect(location.search).toBe("");
  expect(ssoCallback).toBeInstanceOf(Error);
});
