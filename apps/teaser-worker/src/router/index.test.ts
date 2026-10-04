import assert from "node:assert/strict";
import test from "node:test";

import { matchRoute, type RoutePattern } from "./index.ts";

const ROUTES: (RoutePattern & { name: string })[] = [
  { method: "GET", pattern: "/api/admin/guests", name: "list" },
  { method: "PATCH", pattern: "/api/admin/guests/:guestId", name: "edit" },
  { method: "POST", pattern: "/api/admin/guests/:guestId/invite", name: "invite" }
];

test("does hand back decoded params when a pattern matches", () => {
  const match = matchRoute(ROUTES, "PATCH", "/api/admin/guests/g_a%20b");

  assert.equal(match.kind, "matched");
  assert.equal(match.kind === "matched" ? match.route.name : null, "edit");
  assert.deepEqual(match.kind === "matched" ? match.params : null, { guestId: "g_a b" });
});

test("does tell a wrong method from a missing path when a request does not match", () => {
  assert.equal(matchRoute(ROUTES, "DELETE", "/api/admin/guests").kind, "method_not_allowed");
  assert.equal(matchRoute(ROUTES, "GET", "/api/admin/nope").kind, "not_found");
  assert.equal(matchRoute(ROUTES, "POST", "/api/admin/guests/g_1/invite/extra").kind, "not_found");
});

test("does not match a param segment when it is malformed percent-encoding", () => {
  assert.equal(matchRoute(ROUTES, "PATCH", "/api/admin/guests/%E0%A4%A").kind, "not_found");
});
