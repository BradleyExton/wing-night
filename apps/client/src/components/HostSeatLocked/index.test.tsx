import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { hostSeatLockedCopy } from "./copy";
import { HostSeatLocked } from "./index";

test("does tell the device to scan the laptop's code when the seat is locked", () => {
  const html = renderToStaticMarkup(<HostSeatLocked />);

  assert.match(html, /data-host-seat-locked/);
  assert.ok(html.includes(hostSeatLockedCopy.kicker));
  assert.match(html, /QR code on the laptop/);
  assert.doesNotMatch(html, /<button/);
});
