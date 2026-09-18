/* Copyright 2026 Element Creations Ltd.
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-Element-Commercial */

import {
  createContext,
  type FC,
  type ReactNode,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useUrlParams } from "../UrlParams";
import "../../theme-snapshot/starfield.js";

type Claim = (key: symbol, fast: boolean | null) => void;
const SceneContext = createContext<Claim | null>(null);

/** One backdrop survives all standalone routes and their Suspense boundaries. */
export const StarfieldScene: FC<{ children: ReactNode; paused: boolean }> = ({
  children,
  paused,
}) => {
  const { isWidget } = useUrlParams();
  const [claims, setClaims] = useState(new Map<symbol, boolean>());
  const claim = useCallback<Claim>((key, fast) => {
    setClaims((previous) => {
      const next = new Map(previous);
      if (fast === null) next.delete(key);
      else next.set(key, fast);
      return next;
    });
  }, []);
  if (isWidget) return children;
  return (
    <SceneContext.Provider value={claim}>
      <div className="wzrdz-scene">
        <Backdrop fast={[...claims.values()].some(Boolean)} paused={paused} />
        {children}
      </div>
    </SceneContext.Provider>
  );
};

export function useStarfieldClaim(fast: boolean): boolean {
  const claim = useContext(SceneContext);
  useLayoutEffect(() => {
    if (!claim) return;
    const key = Symbol("starfield");
    claim(key, fast);
    return () => claim(key, null);
  }, [claim, fast]);
  return claim !== null;
}

const Backdrop: FC<{ fast: boolean; paused: boolean }> = ({ fast, paused }) => {
  const element = useRef<HTMLDivElement>(null);
  const controller = useRef<ReturnType<typeof WzrdzStarfield.mount> | null>(
    null,
  );
  useLayoutEffect(() => {
    controller.current = WzrdzStarfield.mount(element.current!);
    return () => {
      controller.current?.destroy();
      controller.current = null;
    };
  }, []);
  useLayoutEffect(() => {
    controller.current?.setPaused(paused);
    controller.current?.setFast(fast);
  }, [fast, paused]);
  return <div ref={element} className="wzrdz-sky" aria-hidden="true" />;
};
