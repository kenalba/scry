/* Copyright 2026 Element Creations Ltd.
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-Element-Commercial */
// Classic script for server-rendered pages; also bundled by Scry as a side effect.
(function (scope) {
  const geometry = (width, height, count = 40) => {
    if (width <= 0 || height <= 0) return [];
    return Array.from({ length: count }, (_, i) => {
      const angle = i * 2.399963229728653,
        cos = Math.cos(angle),
        sin = Math.sin(angle);
      const radius = Math.min(width / 2 / Math.abs(cos), height / 2 / Math.abs(sin));
      const duration = 1.6 + ((i * 17) % 13) / 10;
      const phase = (((Math.sin((i + 1) * 78.233) * 43758.5453) % 1) + 1) % 1;
      return { x: cos * radius, y: sin * radius, angle, duration, delay: -phase * duration };
    });
  };
  function mount(root, { fast = false, paused = false } = {}) {
    const doc = root.ownerDocument,
      view = doc.defaultView;
    const query = view.matchMedia(
      "(min-width:769px) and (hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference)",
    );
    root.classList.add("wzrdz-sky");
    root.dataset.blend = "true";
    root.setAttribute("aria-hidden", "true");
    const slow = doc.createElement("div");
    slow.className = "wzrdz-slow";
    slow.dataset.active = "true";
    slow.append(doc.createElement("i"), doc.createElement("i"));
    const rays = doc.createElement("div");
    rays.className = "wzrdz-rays";
    rays.dataset.active = "false";
    root.replaceChildren(slow, rays);
    let animations = [],
      generation = 0,
      destroyed = false,
      moving = false;
    function cancel() {
      generation++;
      animations.forEach((a) => a.cancel());
      animations = [];
      rays
        .querySelectorAll(".wzrdz-ray")
        .forEach((ray) => ray.getAnimations?.().forEach((a) => a.play()));
      root.dataset.settling = "false";
    }
    function settle() {
      const current = ++generation;
      root.dataset.settling = "true";
      rays.querySelectorAll(".wzrdz-ray").forEach((ray) => {
        const computed = view.getComputedStyle(ray),
          matrix = new view.DOMMatrixReadOnly(computed.transform);
        ray.getAnimations().forEach((a) => a.pause());
        animations.push(
          ray.animate(
            [
              { transform: matrix.toString(), opacity: computed.opacity },
              {
                transform: `matrix(${matrix.a},${matrix.b},${matrix.c},${matrix.d},${matrix.e * 1.07},${matrix.f * 1.07})`,
                opacity: 0,
              },
            ],
            { duration: 650, easing: "cubic-bezier(.12,.75,.2,1)", fill: "forwards" },
          ),
        );
      });
      const fade = rays.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 650,
        fill: "forwards",
      });
      animations.push(fade);
      fade.finished
        .then(() => {
          if (destroyed || current !== generation) return;
          // Hide before cancelling the fade: cancelling first re-exposes hyperspace.
          rays.dataset.active = "false";
          cancel();
        })
        .catch(() => {});
    }
    function sync() {
      if (destroyed) return;
      const wasMoving = moving;
      moving = query.matches && !paused && !doc.hidden;
      root.dataset.moving = String(moving);
      root.dataset.fast = String(fast);
      if (!moving) {
        rays.dataset.active = "false";
        cancel();
        return;
      }
      if (fast) {
        cancel();
        rays.dataset.active = "true";
      } else if (rays.dataset.active === "true" && root.dataset.settling !== "true") settle();
      else if (!wasMoving) rays.dataset.active = "false";
    }
    const observer = new view.ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      // Only the ray geometry changes; slow layers and their animation clocks survive.
      rays.dataset.active = "false";
      cancel();
      rays.replaceChildren(
        ...geometry(width, height).map((g) => {
          const ray = doc.createElement("i");
          ray.className = "wzrdz-ray";
          for (const [key, value] of Object.entries(g))
            ray.style.setProperty(
              "--ray-" + key,
              value +
                (key === "angle" ? "rad" : key === "duration" || key === "delay" ? "s" : "px"),
            );
          return ray;
        }),
      );
      sync();
    });
    observer.observe(root);
    query.addEventListener("change", sync);
    doc.addEventListener("visibilitychange", sync);
    sync();
    return {
      setFast(value) {
        if (fast !== value) {
          fast = value;
          sync();
        }
      },
      setPaused(value) {
        if (paused !== value) {
          paused = value;
          sync();
        }
      },
      destroy() {
        destroyed = true;
        rays.dataset.active = "false";
        cancel();
        observer.disconnect();
        query.removeEventListener("change", sync);
        doc.removeEventListener("visibilitychange", sync);
        root.replaceChildren();
      },
    };
  }
  scope.WzrdzStarfield = { mount, geometry };
  // Progressive enhancement for existing two-layer markup and pause controls.
  function enhance() {
    scope.document.querySelectorAll("[data-wzrdz-starfield]").forEach((original) => {
      if (original.dataset.enhanced) return;
      original.dataset.enhanced = "true";
      const root = scope.document.createElement("div");
      original.after(root);
      const controller = mount(root, {
        fast: original.dataset.fast === "true",
        paused: original.dataset.paused === "true",
      });
      original.hidden = true;
      const observer = new MutationObserver(() => {
        controller.setFast(original.dataset.fast === "true");
        controller.setPaused(original.dataset.paused === "true");
      });
      observer.observe(original, {
        attributes: true,
        attributeFilter: ["data-fast", "data-paused"],
      });
      scope.document.addEventListener("submit", (event) => {
        if (!event.defaultPrevented && event.target.matches("[data-wzrdz-busy]"))
          controller.setFast(true);
      });
      scope.addEventListener("pageshow", () => controller.setFast(false));
    });
  }
  if (scope.document) {
    if (scope.document.readyState === "loading")
      scope.document.addEventListener("DOMContentLoaded", enhance, { once: true });
    else enhance();
  }
})(globalThis);
