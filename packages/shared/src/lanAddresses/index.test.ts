import assert from "node:assert/strict";
import test from "node:test";

import {
  HOST_CONTROL_TOKEN_QUERY_KEY,
  HOST_ROUTE_PATH,
  isLoopbackHostname,
  resolveHostJoinRouteUrl,
  resolveLanAddressesUrl,
  resolveLanJoinUrl
} from "./index.js";

test("does swap in the first LAN address and keep the page's port", () => {
  assert.equal(
    resolveLanJoinUrl({ protocol: "http:", port: "5173" }, ["192.168.1.23", "10.8.0.2"], {
      path: HOST_ROUTE_PATH
    }),
    "http://192.168.1.23:5173/host"
  );
});

test("does leave the port off when the page has none", () => {
  assert.equal(
    resolveLanJoinUrl({ protocol: "http:", port: "" }, ["10.0.0.48"], { path: HOST_ROUTE_PATH }),
    "http://10.0.0.48/host"
  );
});

test("does carry the host token in the query when one is given", () => {
  assert.equal(
    resolveLanJoinUrl({ protocol: "http:", port: "5173" }, ["192.168.1.23"], {
      path: HOST_ROUTE_PATH,
      query: { [HOST_CONTROL_TOKEN_QUERY_KEY]: "tok_en-1" }
    }),
    "http://192.168.1.23:5173/host?hostToken=tok_en-1"
  );
});

test("does build any page's address when the path is not the host's", () => {
  assert.equal(
    resolveLanJoinUrl({ protocol: "http:", port: "5173" }, ["10.0.0.48"], {
      path: "/play",
      query: { t: "a b" }
    }),
    "http://10.0.0.48:5173/play?t=a+b"
  );
});

test("does offer nothing when the server knows no LAN address", () => {
  assert.equal(
    resolveLanJoinUrl({ protocol: "http:", port: "5173" }, [], { path: HOST_ROUTE_PATH }),
    null
  );
});

test("does treat localhost, 127 addresses and ::1 as the laptop itself", () => {
  assert.equal(isLoopbackHostname("localhost"), true);
  assert.equal(isLoopbackHostname("127.0.0.1"), true);
  assert.equal(isLoopbackHostname("127.1.2.3"), true);
  assert.equal(isLoopbackHostname("[::1]"), true);
  assert.equal(isLoopbackHostname("10.0.0.48"), false);
});

test("does refuse a hostname that only starts like a loopback address", () => {
  assert.equal(isLoopbackHostname("127.example.com"), false);
  assert.equal(isLoopbackHostname("127.0.0.1.example.com"), false);
  assert.equal(isLoopbackHostname("127.0.0.256"), false);
});

test("does point the route urls at the server origin when it is known", () => {
  assert.equal(resolveLanAddressesUrl(" http://localhost:3000 "), "http://localhost:3000/lan-addresses");
  assert.equal(resolveHostJoinRouteUrl("http://localhost:3000"), "http://localhost:3000/host-join");
  assert.equal(resolveHostJoinRouteUrl(null), null);
  assert.equal(resolveHostJoinRouteUrl("  "), null);
});
