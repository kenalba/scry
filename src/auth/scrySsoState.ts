/*
Copyright 2026 Element Creations Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE in the repository root for full details.
*/

export const SSO_CALLBACK_PATH = "/sso/callback";
const STORAGE_KEY = "scry-sso-pending";
const MAX_AGE_MS = 10 * 60 * 1000;

export interface SsoCallback {
  token: string;
  returnTo: string;
}

/** Only relative, same-origin app routes may survive a login. */
export function safeReturnTo(value: unknown, origin: string): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//")
  )
    return "/";
  const url = new URL(value, origin);
  if (
    url.origin !== origin ||
    [SSO_CALLBACK_PATH, "/login", "/register"].includes(url.pathname)
  )
    return "/";
  return url.pathname + url.search + url.hash;
}

export function prepareSso(
  storage: Storage,
  origin: string,
  returnTo: string,
  nonce: string,
  now = Date.now(),
): string {
  storage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      nonce,
      createdAt: now,
      returnTo: safeReturnTo(returnTo, origin),
    }),
  );
  const callback = new URL(SSO_CALLBACK_PATH, origin);
  callback.searchParams.set("state", nonce);
  return callback.href;
}

/** Consumes a transaction once, before any network request or client mutation. */
export function consumeSso(
  storage: Storage,
  callback: URL,
  now = Date.now(),
): SsoCallback {
  const stored = storage.getItem(STORAGE_KEY);
  storage.removeItem(STORAGE_KEY);
  const pending = stored ? JSON.parse(stored) : null;
  const tokens = callback.searchParams.getAll("loginToken");
  const states = callback.searchParams.getAll("state");
  if (
    callback.pathname !== SSO_CALLBACK_PATH ||
    tokens.length !== 1 ||
    !tokens[0] ||
    states.length !== 1 ||
    !states[0] ||
    !pending ||
    pending.nonce !== states[0] ||
    typeof pending.createdAt !== "number" ||
    now < pending.createdAt ||
    now - pending.createdAt > MAX_AGE_MS
  )
    throw new Error(
      "Sign-in expired or could not be verified. Please sign in again.",
    );
  return {
    token: tokens[0],
    returnTo: safeReturnTo(pending.returnTo, callback.origin),
  };
}
