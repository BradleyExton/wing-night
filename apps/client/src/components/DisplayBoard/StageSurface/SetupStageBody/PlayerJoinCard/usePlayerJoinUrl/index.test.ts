import assert from "node:assert/strict";
import test from "node:test";

import { resolvePlayerJoinUrl } from "./index";

const LAPTOP_PAGE = { protocol: "http:", port: "5173" };

test("does point the phone at the laptop's Wi-Fi address with the join token when both are known", () => {
  assert.equal(
    resolvePlayerJoinUrl(LAPTOP_PAGE, { addresses: ["192.168.1.23", "10.0.0.4"] }, "tok-1"),
    "http://192.168.1.23:5173/play?t=tok-1"
  );
});

test("does draw no code when there is no token, no address or no usable listing", () => {
  assert.equal(resolvePlayerJoinUrl(LAPTOP_PAGE, { addresses: ["192.168.1.23"] }, null), null);
  assert.equal(resolvePlayerJoinUrl(LAPTOP_PAGE, { addresses: [] }, "tok-1"), null);
  assert.equal(resolvePlayerJoinUrl(LAPTOP_PAGE, { addresses: [7] }, "tok-1"), null);
  assert.equal(resolvePlayerJoinUrl(LAPTOP_PAGE, null, "tok-1"), null);
});
