/*
Copyright 2021-2024 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE in the repository root for full details.
*/

import { useTranslation } from "react-i18next";
import { type FC } from "react";

import { useClientState } from "../ClientContext";
import { ErrorPage, LoadingPage } from "../FullScreenView";
import { UnauthenticatedView } from "./UnauthenticatedView";
import { RegisteredView } from "./RegisteredView";
import { useScryMembership } from "../auth/useScryMembership";
import { usePageTitle } from "../usePageTitle";

export const HomePage: FC = () => {
  const { t } = useTranslation();
  usePageTitle(t("common.home"));

  const clientState = useClientState();

  const membership = useScryMembership(clientState?.state === "valid" ? clientState.authenticated?.client : undefined);

  if (!clientState) {
    return <LoadingPage />;
  } else if (clientState.state === "error") {
    return <ErrorPage error={clientState.error} />;
  } else {
    if (membership === "loading") return <LoadingPage />;
    if (membership === "error") return <ErrorPage error={new Error("We couldn’t check your membership. Please reload to try again.")} />;
    return clientState.authenticated && membership === "member" ? (
      <RegisteredView client={clientState.authenticated.client} />
    ) : (
      <UnauthenticatedView />
    );
  }
};
