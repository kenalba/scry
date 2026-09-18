/* Copyright 2026 Element Creations Ltd.
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-Element-Commercial */
import { expect, it, vi } from "vitest";
import { logger } from "matrix-js-sdk/lib/logger";
import { init } from "./rageshake";

it("quiet console retains diagnostic detail and visible warnings/errors", async () => {
  const debug = vi.spyOn(console, "debug").mockImplementation(() => {});
  const info = vi.spyOn(console, "info").mockImplementation(() => {});
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  const error = vi.spyOn(console, "error").mockImplementation(() => {});
  await init({ quietConsole: true });
  logger.debug("SDK routine debug");
  logger.info("SDK routine info");
  logger.getChild("console-test").debug("child routine detail");
  console.debug("DEBUG matrix_sdk_crypto: routine migration");
  console.info("INFO matrix_sdk_indexeddb: routine migration");
  expect(debug).not.toHaveBeenCalled();
  expect(info).not.toHaveBeenCalled();
  logger.warn("SDK useful warning");
  logger.error("SDK useful error");
  console.warn("WARN matrix_sdk_crypto: useful warning");
  expect(warn).toHaveBeenCalled();
  expect(error).toHaveBeenCalled();
  console.info("Unrelated application message");
  expect(info).toHaveBeenCalledWith("Unrelated application message");
  const logs = global.mx_rage_logger.peekLogs();
  for (const message of [
    "SDK routine debug",
    "SDK routine info",
    "child routine detail",
    "routine migration",
    "SDK useful warning",
    "SDK useful error",
  ])
    expect(logs).toContain(message);
});
