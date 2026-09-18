/* Copyright 2026 Element Creations Ltd.
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-Element-Commercial */
import { StrictMode } from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { StarfieldScene, useStarfieldClaim } from "./StarfieldScene";

const params = vi.hoisted(() => ({ isWidget: false }));
vi.mock("../UrlParams", () => ({ useUrlParams: () => params }));
beforeEach(() => {
  params.isWidget = false;
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
  }));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test("independent loading claims survive another claim cleanup and StrictMode", () => {
  const tree = (second: boolean) => (
    <StrictMode>
      <StarfieldScene paused={false}>
        <Claim fast />
        <Claim fast={second} />
      </StarfieldScene>
    </StrictMode>
  );
  const view = render(tree(true));
  const sky = view.container.querySelector(".wzrdz-sky");
  expect(sky?.getAttribute("data-fast")).toBe("true");
  view.rerender(tree(false));
  expect(view.container.querySelector(".wzrdz-sky")).toBe(sky);
  expect(sky?.getAttribute("data-fast")).toBe("true");
  view.rerender(
    <StrictMode>
      <StarfieldScene paused={false}>
        <Claim fast={false} />
      </StarfieldScene>
    </StrictMode>,
  );
  expect(sky?.getAttribute("data-fast")).toBe("false");
});
test("embedded widgets retain their own backgrounds", () => {
  params.isWidget = true;
  const view = render(
    <StarfieldScene paused={false}>
      <span>Host content</span>
    </StarfieldScene>,
  );
  expect(view.container.querySelector(".wzrdz-sky")).toBeNull();
  expect(view.getByText("Host content")).toBeTruthy();
});
function Claim({ fast }: { fast: boolean }) {
  useStarfieldClaim(fast);
  return null;
}
