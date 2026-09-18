/* Copyright 2026 Element Creations Ltd.
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-Element-Commercial */

/** Deterministic radial endpoints on the viewport rectangle, computed only on resize. */
export function starGeometry(
  width: number,
  height: number,
  count = 40,
): {
  x: number;
  y: number;
  angle: number;
  duration: number;
  delay: number;
}[] {
  if (width <= 0 || height <= 0) return [];
  return Array.from({ length: count }, (_, i) => {
    const angle = i * 2.399963229728653;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const radius = Math.min(
      width / 2 / Math.abs(cos),
      height / 2 / Math.abs(sin),
    );
    const duration = 1.6 + ((i * 17) % 13) / 10;
    const phase = (((Math.sin((i + 1) * 78.233) * 43758.5453) % 1) + 1) % 1;
    return {
      x: cos * radius,
      y: sin * radius,
      angle,
      duration,
      // An independent hash avoids synchronizing radius with the golden-angle positions.
      delay: -phase * duration,
    };
  });
}
