/*
Copyright 2026 Element Creations Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE in the repository root for full details.
*/

import { beforeEach, describe, expect, it } from "vitest";
import { consumeSso, prepareSso, safeReturnTo } from "./scrySsoState";

const origin = "https://scry.wzrdz.cool";
const invitation =
  "/room/#/test-call?password=private-key&roomId=%21test%3Ascry.wzrdz.cool";

beforeEach(() => sessionStorage.clear());

describe("Scry SSO transactions", () => {
  it("keeps the complete invitation local, outside the SSO redirect", () => {
    const redirect = prepareSso(
      sessionStorage,
      origin,
      invitation,
      "nonce",
      100,
    );
    expect(redirect).toBe(origin + "/sso/callback?state=nonce");
    expect(redirect).not.toContain("private-key");
    const result = consumeSso(
      sessionStorage,
      new URL(redirect + "&loginToken=one-use"),
      101,
    );
    expect(result).toEqual({ token: "one-use", returnTo: invitation });
    expect(sessionStorage.length).toBe(0);
  });

  it("rejects callback replay", () => {
    const callback = new URL(
      prepareSso(sessionStorage, origin, invitation, "nonce", 100) +
        "&loginToken=token",
    );
    consumeSso(sessionStorage, callback, 101);
    expect(() => consumeSso(sessionStorage, callback, 102)).toThrow();
  });

  it.each([
    ["state=wrong&loginToken=token", 101],
    ["state=nonce&loginToken=token", 600101],
    ["state=nonce&loginToken=token", 99],
    ["state=nonce", 101],
    ["state=nonce&loginToken=", 101],
    ["state=nonce&state=nonce&loginToken=token", 101],
    ["state=nonce&loginToken=one&loginToken=two", 101],
  ])("rejects mismatched, stale or ambiguous callbacks: %s", (query, now) => {
    prepareSso(sessionStorage, origin, invitation, "nonce", 100);
    expect(() =>
      consumeSso(
        sessionStorage,
        new URL(origin + "/sso/callback?" + query),
        now,
      ),
    ).toThrow();
    expect(sessionStorage.length).toBe(0);
  });

  it.each([
    "https://evil.test/",
    "//evil.test/",
    "/\\evil.test/",
    "javascript:alert(1)",
    "/login",
    "/sso/callback?loginToken=old",
    "/register",
    null,
  ])("rejects unsafe return routes: %s", (value) => {
    expect(safeReturnTo(value, origin)).toBe("/");
  });
});
