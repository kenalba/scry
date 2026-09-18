/*
Copyright 2026 Element Creations Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE in the repository root for full details.
*/

import { type FC, useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styles from "../scry/ScryShell.module.css";

import { useClient, useClientState } from "../ClientContext";
import { FieldRow, ErrorMessage } from "../input/Input";
import { ScryShell } from "../scry/ScryShell";
import { usePageTitle } from "../usePageTitle";
import { LoadingPage } from "../FullScreenView";
import { Link } from "../button/Link";
import { completeSsoLogin, startSsoLogin } from "./scrySso";
import { ssoCallback } from "./scrySsoBootstrap";
import { SSO_CALLBACK_PATH } from "./scrySsoState";

export const LoginPage: FC = () => {
  const { t } = useTranslation();
  usePageTitle(t("scry_login.title"));
  const { client, setClient } = useClient();
  const clientState = useClientState();
  const navigate = useNavigate();
  const location = useLocation();
  const isCallback = location.pathname === SSO_CALLBACK_PATH;
  const started = useRef(false);
  const [loading, setLoading] = useState(isCallback);
  const [error, setError] = useState<Error>();

  useEffect(() => {
    if (
      !isCallback ||
      !setClient ||
      clientState?.state !== "valid" ||
      started.current
    )
      return;
    started.current = true;
    if (!ssoCallback || ssoCallback instanceof Error) {
      setError(new Error(t("scry_login.expired")));
      setLoading(false);
      return;
    }
    const { token, returnTo } = ssoCallback;
    completeSsoLogin(token, client)
      .then(async ([memberClient, session]) => {
        setClient(memberClient, session);
        await navigate(returnTo, { replace: true });
      })
      .catch(() => {
        // SDK errors can contain request details: never render/log a token.
        setError(new Error(t("scry_login.failed")));
        setLoading(false);
      });
  }, [client, clientState, isCallback, navigate, setClient, t]);

  const signIn = (): void => {
    try {
      setError(undefined);
      setLoading(true);
      const from = (location.state as { from?: unknown } | null)?.from;
      const destination =
        typeof from === "string"
          ? from
          : from && typeof from === "object" && "pathname" in from
            ? String(from.pathname) +
              ("search" in from ? String(from.search) : "") +
              ("hash" in from ? String(from.hash) : "")
            : isCallback && ssoCallback && !(ssoCallback instanceof Error)
              ? ssoCallback.returnTo
              : "/";
      startSsoLogin(destination);
    } catch {
      setError(new Error(t("scry_login.storage_error")));
      setLoading(false);
    }
  };

  // The callback is a transition, not another sign-in prompt.
  if (loading && !error) return <LoadingPage />;

  return (
    <ScryShell>
      <div>
        <h2>{t("scry_login.title")}</h2>
        <p>{t("scry_login.description")}</p>
        {error && (
          <FieldRow>
            <ErrorMessage error={error} />
          </FieldRow>
        )}
        <FieldRow>
          <button
            type="button"
            className={`${styles.connect} wzrdz-button`}
            onClick={signIn}
            disabled={loading}
          >
            {loading ? t("scry_login.loading") : t("scry_login.button")}
          </button>
        </FieldRow>
      </div>
      <div>
        <p>{t("scry_login.guest_hint")}</p>
        <Link to="/">{t("scry_login.back")}</Link>
      </div>
    </ScryShell>
  );
};
