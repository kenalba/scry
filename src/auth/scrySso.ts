/*
Copyright 2026 Element Creations Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE in the repository root for full details.
*/

import { createClient, type MatrixClient } from "matrix-js-sdk";

import { Config } from "../config/Config";
import { type Session } from "../ClientContext";
import { initClient } from "../utils/matrix";
import { prepareSso } from "./scrySsoState";

/** Standalone-only boundary. The invitation secret never leaves this tab's storage. */
export function startSsoLogin(returnTo?: string): void {
  const { origin, pathname, search, hash } = window.location;
  const redirectUrl = prepareSso(
    window.sessionStorage,
    origin,
    returnTo ?? pathname + search + hash,
    window.crypto.randomUUID(),
  );
  const homeserver = Config.defaultHomeserverUrl();
  if (!homeserver) throw new Error("The meeting server is not configured.");
  const target = new URL(
    "/_matrix/client/v3/login/sso/redirect/oidc-wzrdz",
    homeserver,
  );
  target.searchParams.set("redirectUrl", redirectUrl);
  window.location.assign(target.href);
}

export async function completeSsoLogin(
  token: string,
  oldClient?: MatrixClient,
): Promise<[MatrixClient, Session]> {
  const homeserver = Config.defaultHomeserverUrl();
  if (!homeserver) throw new Error("The meeting server is not configured.");
  const authClient = createClient({ baseUrl: homeserver });
  const response = await authClient.login("m.login.token", {
    token,
    initial_device_display_name: "Scry",
  });
  const session: Session = {
    user_id: response.user_id,
    access_token: response.access_token,
    device_id: response.device_id,
    passwordlessUser: false,
  };

  // Exchange succeeds before touching the visitor's session. Guest rooms and
  // profile data are deliberately not copied into the member account.
  try {
    await oldClient?.logout(true);
  } catch {
    // Expired guest tokens and network errors must not block member sign-in.
  } finally {
    oldClient?.stopClient();
  }
  localStorage.removeItem("matrix-auth-store");
  const client = await initClient(
    {
      baseUrl: homeserver,
      accessToken: session.access_token,
      userId: session.user_id,
      deviceId: session.device_id,
    },
    false,
  ); // Clears the previous account's IndexedDB/crypto stores.
  return [client, session];
}
