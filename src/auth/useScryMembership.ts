import { useEffect, useState } from "react";
import { type MatrixClient } from "matrix-js-sdk";

/** Presentation only. Synapse independently enforces the same authority. */
export function useScryMembership(client?: MatrixClient): "loading" | "member" | "guest" | "error" {
  const [state, setState] = useState<"loading" | "member" | "guest" | "error">(client ? "loading" : "guest");
  useEffect(() => {
    if (!client) { setState("guest"); return; }
    const controller = new AbortController();
    setState("loading");
    fetch(`${client.getHomeserverUrl()}/_synapse/client/scry/member`, {
      headers: { Authorization: `Bearer ${client.getAccessToken()}` },
      cache: "no-store", signal: controller.signal,
    }).then(async (response) => {
      if (!response.ok) throw new Error("Membership check unavailable");
      const data: unknown = await response.json();
      setState(typeof data === "object" && data !== null && "can_create_room" in data && data.can_create_room === true ? "member" : "guest");
    }).catch(() => { if (!controller.signal.aborted) setState("error"); });
    return () => controller.abort();
  }, [client]);
  return state;
}
