/* Copyright 2026 Element Creations Ltd.
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-Element-Commercial */
import { expect, test } from "vitest";
import { starGeometry } from "./starGeometry";

test.each([
  [1440, 900],
  [390, 844],
  [1920, 400],
])(
  "every ray reaches the rectangular viewport edge at %i×%i",
  (width, height) => {
    for (const ray of starGeometry(width, height)) {
      expect(Math.abs(ray.x)).toBeLessThanOrEqual(width / 2 + 0.00001);
      expect(Math.abs(ray.y)).toBeLessThanOrEqual(height / 2 + 0.00001);
      expect(
        Math.min(
          Math.abs(Math.abs(ray.x) - width / 2),
          Math.abs(Math.abs(ray.y) - height / 2),
        ),
      ).toBeLessThan(0.00001);
      expect(ray.delay).toBeLessThanOrEqual(0);
      expect(ray.delay).toBeGreaterThan(-ray.duration);
    }
  },
);
test("streaks are staggered rather than respawning as a single field", () => {
  const rays = starGeometry(1440, 900);
  expect(new Set(rays.map((ray) => ray.delay)).size).toBe(rays.length);
});
