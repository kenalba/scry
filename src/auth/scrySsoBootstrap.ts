/*
Copyright 2026 Element Creations Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE in the repository root for full details.
*/

import {
  consumeSso,
  SSO_CALLBACK_PATH,
  type SsoCallback,
} from "./scrySsoState";

// Standalone browser boundary, imported before application initialization so the
// single-use credential cannot reach URL analytics, routing or diagnostic logs.
export const ssoCallback: SsoCallback | Error | undefined = captureCallback();

function captureCallback(): SsoCallback | Error | undefined {
  const url = new URL(window.location.href);
  if (url.pathname !== SSO_CALLBACK_PATH) return undefined;
  window.history.replaceState(null, "", SSO_CALLBACK_PATH);
  try {
    return consumeSso(window.sessionStorage, url);
  } catch {
    return new Error(
      "Sign-in expired or could not be verified. Please sign in again.",
    );
  }
}
