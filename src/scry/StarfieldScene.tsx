/* Copyright 2026 Element Creations Ltd.
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-Element-Commercial */

import {
  createContext,
  type CSSProperties,
  type FC,
  type ReactNode,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useUrlParams } from "../UrlParams";
import { useRootElement } from "../RootElementContext";
import { starGeometry } from "./starGeometry";

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
  const root = useRootElement();
  const doc = root.ownerDocument;
  const view = doc.defaultView!;
  const element = useRef<HTMLDivElement>(null);
  const streaks = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [allowed, setAllowed] = useState(false);
  const [showFast, setShowFast] = useState(fast);
  const [settling, setSettling] = useState(false);
  const geometry = useMemo(() => starGeometry(size.width, size.height), [size]);
  useLayoutEffect(() => {
    const query = view.matchMedia(
      "(min-width:769px) and (hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference)",
    );
    const update = (): void => setAllowed(query.matches && !doc.hidden);
    update();
    query.addEventListener("change", update);
    doc.addEventListener("visibilitychange", update);
    const observer = new ResizeObserver(([entry]) => {
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    observer.observe(element.current!);
    return () => {
      query.removeEventListener("change", update);
      doc.removeEventListener("visibilitychange", update);
      observer.disconnect();
    };
  }, [view, doc]);
  const moving = allowed && !paused;
  useLayoutEffect(() => {
    const layer = streaks.current;
    if (fast || !moving || !layer) {
      setShowFast(fast && moving);
      setSettling(false);
      return;
    }
    // A still-mounted fast layer means this is an arrival, not an idle rerender.
    if (layer.dataset.active !== "true") return;
    setSettling(true);
    const animations: Animation[] = [];
    layer.querySelectorAll<HTMLElement>(".wzrdz-ray").forEach((ray) => {
      const computed = view.getComputedStyle(ray);
      const matrix = new DOMMatrixReadOnly(computed.transform);
      const opacity = computed.opacity;
      ray.getAnimations().forEach((animation) => animation.pause());
      animations.push(
        ray.animate(
          [
            { transform: matrix.toString(), opacity },
            {
              transform: `matrix(${matrix.a},${matrix.b},${matrix.c},${matrix.d},${matrix.e * 1.07},${matrix.f * 1.07})`,
              opacity: 0,
            },
          ],
          {
            duration: 650,
            easing: "cubic-bezier(.12,.75,.2,1)",
            fill: "forwards",
          },
        ),
      );
    });
    const fade = layer.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 650,
      fill: "forwards",
    });
    animations.push(fade);
    let cancelled = false;
    void fade.finished
      .then(() => {
        if (!cancelled) {
          setShowFast(false);
          setSettling(false);
          animations.forEach((animation) => animation.cancel());
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      animations.forEach((animation) => animation.cancel());
      layer
        .querySelectorAll(".wzrdz-ray")
        .forEach((ray) =>
          ray.getAnimations().forEach((animation) => animation.play()),
        );
    };
  }, [fast, moving, view]);
  return (
    <div
      ref={element}
      className="wzrdz-sky"
      data-moving={moving}
      data-fast={fast}
      data-settling={settling}
      aria-hidden="true"
    >
      <div className="wzrdz-slow" data-active={!showFast || settling}>
        <i />
        <i />
      </div>
      <div ref={streaks} className="wzrdz-rays" data-active={showFast}>
        {geometry.map((ray, i) => (
          <i
            key={i}
            className="wzrdz-ray"
            style={
              {
                "--ray-x": `${ray.x}px`,
                "--ray-y": `${ray.y}px`,
                "--ray-angle": `${ray.angle}rad`,
                "--ray-duration": `${ray.duration}s`,
                "--ray-delay": `${ray.delay}s`,
              } as CSSProperties
            }
          />
        ))}
      </div>
    </div>
  );
};
