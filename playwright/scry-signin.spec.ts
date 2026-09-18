/*
Copyright 2026 Element Creations Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE in the repository root for full details.
*/

import { test, expect } from "@playwright/test";

test("member sign-in uses wzrdz.cool SSO with a clean callback", async ({
  page,
}) => {
  let redirect: URL | undefined;
  await page.route(
    "**/_matrix/client/v3/login/sso/redirect/oidc-wzrdz?*",
    async (route) => {
      redirect = new URL(route.request().url());
      await route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "Identity provider handoff",
      });
    },
  );
  await page.goto("/login");
  await page.getByRole("button", { name: "connect" }).click();
  await expect(page.getByText("Identity provider handoff")).toBeVisible();
  const callback = new URL(redirect!.searchParams.get("redirectUrl")!);
  expect(callback.pathname).toBe("/sso/callback");
  expect(Array.from(callback.searchParams.keys())).toEqual(["state"]);
  expect(callback.hash).toBe("");
});

test("unsolicited callbacks scrub tokens and fail without signing in", async ({
  page,
}) => {
  let tokenExchanges = 0;
  await page.route("**/_matrix/client/v3/login", async (route) => {
    tokenExchanges++;
    await route.abort();
  });
  await page.goto("/sso/callback?state=unsolicited&loginToken=do-not-keep");
  await expect(page).toHaveURL(/\/sso\/callback$/);
  await expect(
    page.getByText(
      "Sign-in expired or could not be verified. Please sign in again.",
    ),
  ).toBeVisible();
  expect(tokenExchanges).toBe(0);
});

test("standalone registration redirects to member sign-in", async ({
  page,
}) => {
  await page.goto("/register");
  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("button", { name: "connect" }),
  ).toBeVisible();
});
