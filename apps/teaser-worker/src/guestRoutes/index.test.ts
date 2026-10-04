import assert from "node:assert/strict";
import test from "node:test";

import type { GuestVote, PortalGuest, PortalMe } from "@wingnight/shared/guestPortal";

import { createTestPortal, type TestPortal } from "../testing/harness/index.ts";

const GUEST_ROUTES = [
  ["GET", "/api/me"],
  ["GET", "/api/guests"],
  ["PUT", "/api/me/vote"]
] as const;

const VOTE: GuestVote = { genreRanking: ["disco", "metal"], teammateWishes: ["g_ana"], teamFormat: "random_draw" };

const portalWithGuests = (): TestPortal => {
  const portal = createTestPortal();

  portal.addGuest({ guestId: "g_rob", displayName: "Rob", email: "rob@example.com" });
  portal.addGuest({ guestId: "g_ana", displayName: "Ana", email: "ana@example.com", isAdmin: true });

  return portal;
};

test("does answer 401 on every guest route when there is no session", async () => {
  const portal = portalWithGuests();

  for (const [method, path] of GUEST_ROUTES) {
    const response = await portal.request(method, path, method === "PUT" ? { body: VOTE } : {});

    assert.equal(response.status, 401, `${method} ${path}`);
    assert.deepEqual(await response.json(), { error: "unauthorized" });
  }
});

test("does answer 401 on every guest route when the session has expired or is unknown", async () => {
  const portal = portalWithGuests();
  const cookie = await portal.signInAs("g_rob", 60_000);

  portal.clock.now += 60_000;

  for (const [method, path] of GUEST_ROUTES) {
    const options = method === "PUT" ? { body: VOTE } : {};

    assert.equal((await portal.request(method, path, { ...options, cookie })).status, 401, `${method} ${path}`);
    assert.equal(
      (await portal.request(method, path, { ...options, cookie: "wn_session=forged" })).status,
      401,
      `${method} ${path}`
    );
  }
});

test("does describe the signed-in guest, own address included, when they read /api/me", async () => {
  const portal = portalWithGuests();
  const cookie = await portal.signInAs("g_rob");
  const me = (await (await portal.request("GET", "/api/me", { cookie })).json()) as PortalMe;

  assert.deepEqual(me, {
    guestId: "g_rob",
    displayName: "Rob",
    email: "rob@example.com",
    isAdmin: false,
    hasHead: false,
    vote: null
  });
});

test("does list only ids and names when a guest reads the guest list", async () => {
  const portal = portalWithGuests();
  const anaCookie = await portal.signInAs("g_ana");

  await portal.request("PUT", "/api/me/vote", { cookie: anaCookie, body: { ...VOTE, teammateWishes: ["g_rob"] } });

  const cookie = await portal.signInAs("g_rob");
  const response = await portal.request("GET", "/api/guests", { cookie });
  const text = await response.text();
  const guests = JSON.parse(text) as PortalGuest[];

  assert.deepEqual(guests, [
    { guestId: "g_ana", displayName: "Ana" },
    { guestId: "g_rob", displayName: "Rob" }
  ]);
  assert.ok(guests.every((guest) => Object.keys(guest).sort().join() === "displayName,guestId"));
  assert.ok(!text.includes("@"), "an address leaked");
  assert.ok(!/wish|admin|vote/i.test(text), "a wish or flag leaked");
});

test("does save the vote and read it back when it is valid", async () => {
  const portal = portalWithGuests();
  const cookie = await portal.signInAs("g_rob");
  const saved = await portal.request("PUT", "/api/me/vote", { cookie, body: VOTE });

  assert.equal(saved.status, 200);
  assert.deepEqual(await saved.json(), VOTE);

  const replaced = { ...VOTE, teamFormat: "host_assigns" as const, teammateWishes: [] };

  await portal.request("PUT", "/api/me/vote", { cookie, body: replaced });

  const me = (await (await portal.request("GET", "/api/me", { cookie })).json()) as PortalMe;

  assert.deepEqual(me.vote, replaced);
});

test("does refuse the vote when it wishes for the voter, an unknown guest, or too many", async () => {
  const portal = portalWithGuests();
  const cookie = await portal.signInAs("g_rob");
  const refusedBodies = [
    { ...VOTE, teammateWishes: ["g_rob"] },
    { ...VOTE, teammateWishes: ["g_nobody"] },
    { ...VOTE, teammateWishes: ["g_ana", "g_x", "g_y"] },
    { ...VOTE, genreRanking: ["yodel"] },
    { ...VOTE, teamFormat: "draft" },
    "not json at all"
  ];

  for (const body of refusedBodies) {
    const response = await portal.request("PUT", "/api/me/vote", { cookie, body });

    assert.equal(response.status, 400, JSON.stringify(body));
  }

  assert.equal(portal.db.raw.prepare("SELECT COUNT(*) AS n FROM votes").get()?.n, 0);
});

test("does report a head when the guest has an accepted avatar attempt", async () => {
  const portal = portalWithGuests();
  const cookie = await portal.signInAs("g_rob");

  portal.db.raw
    .prepare(
      "INSERT INTO avatar_attempts (attempt_id, guest_id, created_at, status, accepted_at) VALUES ('a_1', 'g_rob', 1, 'painted', 2)"
    )
    .run();

  const me = (await (await portal.request("GET", "/api/me", { cookie })).json()) as PortalMe;

  assert.equal(me.hasHead, true);
});

test("does stamp last-seen at most every ten minutes when a guest keeps using the API", async () => {
  const portal = portalWithGuests();
  const cookie = await portal.signInAs("g_rob");
  const readLastSeen = () => portal.db.raw.prepare("SELECT last_seen_at FROM guests WHERE guest_id = 'g_rob'").get()?.last_seen_at;

  portal.clock.now += 60_000;
  await portal.request("GET", "/api/me", { cookie });
  await portal.settle();
  assert.equal(readLastSeen(), null);

  portal.clock.now += 10 * 60_000;
  await portal.request("GET", "/api/me", { cookie });
  await portal.settle();
  assert.equal(readLastSeen(), portal.clock.now);
});
