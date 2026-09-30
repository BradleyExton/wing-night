import assert from "node:assert/strict";
import test from "node:test";

import { isLoopbackHostname, resolveHostJoinUrl } from "./index.js";

test("does swap in the first LAN address and keep the page's port", () => {
  assert.equal(
    resolveHostJoinUrl({ protocol: "http:", port: "5173" }, [
      "192.168.1.23",
      "10.8.0.2"
    ]),
    "http://192.168.1.23:5173/host"
  );
});

test("does leave the port off when the page has none", () => {
  assert.equal(
    resolveHostJoinUrl({ protocol: "http:", port: "" }, ["10.0.0.48"]),
    "http://10.0.0.48/host"
  );
});

test("does offer nothing when the server knows no LAN address", () => {
  assert.equal(
    resolveHostJoinUrl({ protocol: "http:", port: "5173" }, []),
    null
  );
});

test("does treat localhost, 127 addresses and ::1 as the laptop itself", () => {
  assert.equal(isLoopbackHostname("localhost"), true);
  assert.equal(isLoopbackHostname("127.0.0.1"), true);
  assert.equal(isLoopbackHostname("[::1]"), true);
  assert.equal(isLoopbackHostname("10.0.0.48"), false);
});
