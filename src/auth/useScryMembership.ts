import {
  createElement,
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { type MatrixClient } from "matrix-js-sdk";
import { useUrlParams } from "../UrlParams";
import { useClientState } from "../ClientContext";

type Membership = "loading" | "member" | "guest" | "error";
const MembershipContext = createContext<Membership>("loading");

/** Keep the presentation check alive across navigation, including leaving a circle. */
export function ScryMembershipProvider({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  const clientState = useClientState();
  const { isWidget } = useUrlParams();
  const membership = useScryMembership(
    !isWidget && clientState?.state === "valid"
      ? clientState.authenticated?.client
      : undefined,
  );
  return createElement(
    MembershipContext.Provider,
    { value: membership },
    children,
  );
}

export const useScryMembershipState = (): Membership =>
  useContext(MembershipContext);

/** Presentation only. Synapse independently enforces the same authority. */
export function useScryMembership(client?: MatrixClient): Membership {
  const token = client?.getAccessToken();
  const [result, setResult] = useState<{
    client: MatrixClient;
    token: string | null | undefined;
    state: Membership;
  }>();
  useEffect(() => {
    if (!client) {
      setResult(undefined);
      return;
    }
    const controller = new AbortController();
    fetch(`${client.getHomeserverUrl()}/_synapse/client/scry/member`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Membership check unavailable");
        const data: unknown = await response.json();
        if (!controller.signal.aborted)
          setResult({
            client,
            token,
            state:
              typeof data === "object" &&
              data !== null &&
              "can_create_room" in data &&
              data.can_create_room === true
                ? "member"
                : "guest",
          });
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setResult({ client, token, state: "error" });
      });
    return () => controller.abort();
  }, [client, token]);
  if (!client) return "guest";
  return result?.client === client && result.token === token
    ? result.state
    : "loading";
}
