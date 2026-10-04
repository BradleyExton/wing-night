import assert from "node:assert/strict";
import test from "node:test";

import { isLoopbackAddress, isLoopbackHost, isLoopbackOrigin, isLoopbackPeer } from "./index.js";

test("does accept the laptop's own addresses when they are loopback", () => {
  assert.equal(isLoopbackAddress("127.0.0.1"), true);
  assert.equal(isLoopbackAddress("127.45.6.7"), true);
  assert.equal(isLoopbackAddress("::1"), true);
  assert.equal(isLoopbackAddress("::ffff:127.0.0.1"), true);
  assert.equal(isLoopbackAddress("::FFFF:127.0.0.1"), true);
});

test("does refuse LAN and public peers when they are not loopback", () => {
  assert.equal(isLoopbackAddress("192.168.1.23"), false);
  assert.equal(isLoopbackAddress("::ffff:192.168.1.23"), false);
  assert.equal(isLoopbackAddress("fe80::1"), false);
  assert.equal(isLoopbackAddress("203.0.113.20"), false);
});

test("does refuse anything that is not an address when given a name or nothing", () => {
  assert.equal(isLoopbackAddress(undefined), false);
  assert.equal(isLoopbackAddress(""), false);
  assert.equal(isLoopbackAddress("localhost"), false);
  assert.equal(isLoopbackAddress("127.example.com"), false);
});

test("does recognise laptop pages when the origin is loopback", () => {
  assert.equal(isLoopbackOrigin("http://localhost:5173"), true);
  assert.equal(isLoopbackOrigin("http://127.0.0.1:5273"), true);
  assert.equal(isLoopbackOrigin("http://[::1]:5173"), true);
  assert.equal(isLoopbackOrigin("http://192.168.1.23:5173"), false);
  assert.equal(isLoopbackOrigin("http://127.evil.example"), false);
  assert.equal(isLoopbackOrigin("null"), false);
});

test("does recognise the laptop's own names when the Host header is loopback", () => {
  assert.equal(isLoopbackHost("localhost:3000"), true);
  assert.equal(isLoopbackHost("127.0.0.1:3000"), true);
  assert.equal(isLoopbackHost("[::1]:3000"), true);
  assert.equal(isLoopbackHost("localhost"), true);
  assert.equal(isLoopbackHost("attacker.example:3000"), false);
  assert.equal(isLoopbackHost("10.0.0.4:3000"), false);
  assert.equal(isLoopbackHost(undefined), false);
  assert.equal(isLoopbackHost(""), false);
});

test("does refuse a loopback peer when a foreign page sent it", () => {
  const host = "localhost:3000";

  assert.equal(isLoopbackPeer({ address: "::1", host, origin: undefined }), true);
  assert.equal(isLoopbackPeer({ address: "::1", host, origin: "http://localhost:5173" }), true);
  assert.equal(isLoopbackPeer({ address: "::1", host, origin: "https://evil.example" }), false);
  assert.equal(
    isLoopbackPeer({ address: "192.168.1.40", host, origin: "http://localhost:5173" }),
    false
  );
});

// DNS rebinding: the page's own name now resolves to 127.0.0.1, so its
// same-origin request carries no Origin — only its Host gives it away.
test("does refuse a loopback peer when the Host header names a foreign site", () => {
  assert.equal(
    isLoopbackPeer({ address: "::ffff:127.0.0.1", host: "attacker.example:3000", origin: undefined }),
    false
  );
  assert.equal(
    isLoopbackPeer({ address: "::ffff:127.0.0.1", host: "127.0.0.1:3000", origin: undefined }),
    true
  );
});
