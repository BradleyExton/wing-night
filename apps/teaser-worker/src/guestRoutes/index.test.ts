import assert from "node:assert/strict";
import test from "node:test";

import type { OutfitsByGenre } from "@wingnight/shared";
import type { PortalMe, PortalOutfitSaved, PortalTeamList, PortalTeamPicked } from "@wingnight/shared/guestPortal";

import { resolveHeadKey } from "../avatarStore/index.ts";
import { FAKE_HEAD_PNG_BASE64 } from "../headPainter/fakeHead.ts";
import { createTestPortal, TEST_TEAM_NAMES, type TestPortal } from "../testing/harness/index.ts";

const GUEST_ROUTES = [
  ["GET", "/api/me"],
  ["GET", "/api/guests/g_ana/avatar"],
  ["GET", "/api/teams"],
  ["PUT", "/api/me/team"],
  ["PUT", "/api/me/outfit"]
] as const;

const [IRON_HENS, MIRROR_BALLS, BARN_BURNERS] = TEST_TEAM_NAMES as [string, string, string];

const portalWithGuests = (options?: Parameters<typeof createTestPortal>[0]): TestPortal => {
  const portal = createTestPortal(options);

  portal.addGuest({ guestId: "g_rob", displayName: "Rob", email: "rob@example.com" });
  portal.addGuest({ guestId: "g_ana", displayName: "Ana", email: "ana@example.com", isAdmin: true });

  return portal;
};

const pickTeam = (portal: TestPortal, cookie: string, teamName: unknown): Promise<Response> =>
  portal.request("PUT", "/api/me/team", { cookie, body: { teamName } });

const saveOutfit = (portal: TestPortal, cookie: string, body: unknown): Promise<Response> =>
  portal.request("PUT", "/api/me/outfit", { cookie, body });

const THRASH = {
  top: { item: "battle-vest-a" },
  sleeve: { item: "leather-sleeve-a", style: "ink" },
  prop: { item: "flying-v-a", style: "gold" }
} as const;

const readMe = async (portal: TestPortal, cookie: string): Promise<PortalMe> =>
  (await (await portal.request("GET", "/api/me", { cookie })).json()) as PortalMe;

const readTeams = async (portal: TestPortal, cookie: string): Promise<PortalTeamList> =>
  (await (await portal.request("GET", "/api/teams", { cookie })).json()) as PortalTeamList;

// Spread because a node:sqlite row has no prototype, which deepEqual minds.
const readPickRow = (portal: TestPortal, guestId: string): { team_name: string; outfits_json: string } | undefined => {
  const row = portal.db.raw.prepare("SELECT team_name, outfits_json FROM team_picks WHERE guest_id = ?").get(guestId);

  return row === undefined ? undefined : { team_name: String(row.team_name), outfits_json: String(row.outfits_json) };
};

// An accepted head, as the studio leaves one: the PNG in R2 and the accepted try in D1.
const giveHead = async (portal: TestPortal, guestId: string, headHash: string): Promise<void> => {
  await portal.bucket.put(
    resolveHeadKey(guestId),
    Uint8Array.from(atob(FAKE_HEAD_PNG_BASE64), (character) => character.charCodeAt(0)),
    { httpMetadata: { contentType: "image/png" } }
  );
  portal.db.raw
    .prepare(
      `INSERT INTO avatar_attempts (attempt_id, guest_id, created_at, status, object_key, head_hash, accepted_at)
       VALUES (?, ?, ?, 'painted', ?, ?, ?)`
    )
    .run(`a_${guestId}`, guestId, portal.clock.now, resolveHeadKey(guestId), headHash, portal.clock.now);
};

test("does answer 401 on every guest route when there is no session", async () => {
  const portal = portalWithGuests();

  for (const [method, path] of GUEST_ROUTES) {
    const response = await portal.request(method, path, method === "PUT" ? { body: { teamName: IRON_HENS } } : {});

    assert.equal(response.status, 401, `${method} ${path}`);
    assert.deepEqual(await response.json(), { error: "unauthorized" });
  }
});

test("does answer 401 on every guest route when the session has expired or is unknown", async () => {
  const portal = portalWithGuests();
  const cookie = await portal.signInAs("g_rob", 60_000);

  portal.clock.now += 60_000;

  for (const [method, path] of GUEST_ROUTES) {
    const options = method === "PUT" ? { body: { teamName: IRON_HENS } } : {};

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

  assert.deepEqual(await readMe(portal, cookie), {
    guestId: "g_rob",
    displayName: "Rob",
    email: "rob@example.com",
    isAdmin: false,
    hasHead: false,
    avatar: { triesMax: 5, triesLeft: 5, hasPhoto: false, headHash: null },
    team: null,
    picksClosed: false
  });
});

test("does list the roster's teams in file order with the cap and the switch when a guest reads the teams", async () => {
  const portal = portalWithGuests();
  const cookie = await portal.signInAs("g_rob");

  assert.deepEqual(await readTeams(portal, cookie), {
    teams: [
      { id: "team-1", name: IRON_HENS, genre: "Metal", color: "teamB", members: [] },
      { id: "team-2", name: MIRROR_BALLS, genre: "Disco", members: [] },
      { id: "team-3", name: BARN_BURNERS, genre: "Country", members: [] }
    ],
    seatCap: 1,
    picksClosed: false
  });
});

test("does cap each team at the guests over the teams, rounded up and counting admins, when the teams are read", async () => {
  const portal = portalWithGuests();
  const cookie = await portal.signInAs("g_rob");

  // Rob and Ana (an admin) over three teams: one seat each.
  assert.equal((await readTeams(portal, cookie)).seatCap, 1);

  portal.addGuest({ guestId: "g_kim", displayName: "Kim" });
  portal.addGuest({ guestId: "g_lee", displayName: "Lee" });
  assert.equal((await readTeams(portal, cookie)).seatCap, 2, "four guests over three teams");

  for (const guestId of ["g_max", "g_ned", "g_oli"]) {
    portal.addGuest({ guestId, displayName: guestId });
  }

  assert.equal((await readTeams(portal, cookie)).seatCap, 3, "seven guests over three teams");
});

test("does seat the guest and answer the pick with the list when they pick a team", async () => {
  const portal = portalWithGuests();
  const cookie = await portal.signInAs("g_rob");

  await giveHead(portal, "g_rob", "a".repeat(64));

  const response = await pickTeam(portal, cookie, MIRROR_BALLS);
  const picked = (await response.json()) as PortalTeamPicked;

  assert.equal(response.status, 200);
  assert.deepEqual(picked.team, { teamName: MIRROR_BALLS, outfitsByGenre: {} });
  assert.deepEqual(
    picked.teams.teams.map((team) => [team.name, team.members]),
    [
      [IRON_HENS, []],
      [MIRROR_BALLS, [{ guestId: "g_rob", displayName: "Rob", headHash: "a".repeat(64) }]],
      [BARN_BURNERS, []]
    ]
  );
  assert.deepEqual(readPickRow(portal, "g_rob"), { team_name: MIRROR_BALLS, outfits_json: "{}" });
  assert.deepEqual((await readMe(portal, cookie)).team, { teamName: MIRROR_BALLS, outfitsByGenre: {} });
});

test("does move the guest and keep every outfit in the row when they switch teams", async () => {
  const portal = portalWithGuests();
  const cookie = await portal.signInAs("g_rob");
  const outfits: OutfitsByGenre = { metal: { top: { item: "battle-vest-a" } }, disco: { tail: { item: "tinsel-a" } } };

  await pickTeam(portal, cookie, IRON_HENS);
  portal.db.raw
    .prepare("UPDATE team_picks SET outfits_json = ? WHERE guest_id = 'g_rob'")
    .run(JSON.stringify(outfits));

  const moved = (await (await pickTeam(portal, cookie, BARN_BURNERS)).json()) as PortalTeamPicked;

  assert.deepEqual(moved.team, { teamName: BARN_BURNERS, outfitsByGenre: outfits });
  assert.deepEqual(
    moved.teams.teams.map((team) => team.members.map((member) => member.guestId)),
    [[], [], ["g_rob"]]
  );
  assert.deepEqual(readPickRow(portal, "g_rob"), { team_name: BARN_BURNERS, outfits_json: JSON.stringify(outfits) });
});

test("does succeed without writing anything when the guest re-picks the team they are on", async () => {
  const portal = portalWithGuests();
  const cookie = await portal.signInAs("g_rob");

  await pickTeam(portal, cookie, IRON_HENS);
  portal.db.raw
    .prepare("UPDATE team_picks SET outfits_json = '{\"metal\":{}}', updated_at = 7 WHERE guest_id = 'g_rob'")
    .run();

  // The team is full (cap 1) with Rob on it; his own seat does not count against him.
  const again = await pickTeam(portal, cookie, IRON_HENS);
  const picked = (await again.json()) as PortalTeamPicked;

  assert.equal(again.status, 200);
  assert.deepEqual(picked.team, { teamName: IRON_HENS, outfitsByGenre: { metal: {} } });
  assert.deepEqual(picked.teams.teams[0]?.members.map((member) => member.guestId), ["g_rob"]);
  assert.deepEqual(readPickRow(portal, "g_rob"), { team_name: IRON_HENS, outfits_json: '{"metal":{}}' });
  assert.equal(portal.db.raw.prepare("SELECT updated_at FROM team_picks WHERE guest_id = 'g_rob'").get()?.updated_at, 7);
});

test("does succeed when the guest re-picks a team Brad has seated over the cap", async () => {
  const portal = portalWithGuests();
  const cookie = await portal.signInAs("g_rob");

  // Cap 1; Brad seats Ana beside Rob anyway. The others on the team now equal the cap, so the
  // conditional insert alone would refuse Rob his own seat.
  await pickTeam(portal, cookie, IRON_HENS);
  portal.db.raw
    .prepare("INSERT INTO team_picks (guest_id, team_name, outfits_json, updated_at) VALUES ('g_ana', ?, '{}', 1)")
    .run(IRON_HENS);

  const again = await pickTeam(portal, cookie, IRON_HENS);

  assert.equal(again.status, 200);
  assert.deepEqual(
    ((await again.json()) as PortalTeamPicked).teams.teams[0]?.members.map((member) => member.guestId),
    ["g_ana", "g_rob"]
  );
  assert.equal((await pickTeam(portal, cookie, MIRROR_BALLS)).status, 200, "a different team still seats him");
});

test("does refuse with team_full and leave the guest where they were when the team has no seat left", async () => {
  const portal = portalWithGuests();
  const robCookie = await portal.signInAs("g_rob");
  const anaCookie = await portal.signInAs("g_ana");

  await pickTeam(portal, robCookie, IRON_HENS);
  await pickTeam(portal, anaCookie, MIRROR_BALLS);

  const refused = await pickTeam(portal, anaCookie, IRON_HENS);

  assert.equal(refused.status, 409);
  assert.deepEqual(await refused.json(), { error: "team_full" });
  assert.equal(readPickRow(portal, "g_ana")?.team_name, MIRROR_BALLS);
  assert.deepEqual(
    (await readTeams(portal, anaCookie)).teams.map((team) => team.members.map((member) => member.guestId)),
    [["g_rob"], ["g_ana"], []]
  );
});

test("does refuse with team_full when a guest with no pick yet asks for a full team", async () => {
  const portal = portalWithGuests();

  await pickTeam(portal, await portal.signInAs("g_rob"), IRON_HENS);

  const refused = await pickTeam(portal, await portal.signInAs("g_ana"), IRON_HENS);

  assert.equal(refused.status, 409);
  assert.equal(readPickRow(portal, "g_ana"), undefined);
});

// Two guests racing for the last seat. The seat is taken by one conditional statement, so
// whichever runs second finds the count at the cap and changes nothing. The sqlite fake runs
// statements one at a time, so this proves the single-statement shape refuses the loser — not
// that D1 interleaves two requests the same way (it serialises writes too).
test("does seat exactly one of two guests when both pick the last seat at once", async () => {
  const portal = portalWithGuests();
  const [robCookie, anaCookie] = await Promise.all([portal.signInAs("g_rob"), portal.signInAs("g_ana")]);
  const responses = await Promise.all([pickTeam(portal, robCookie, BARN_BURNERS), pickTeam(portal, anaCookie, BARN_BURNERS)]);
  const statuses = responses.map((response) => response.status).sort();

  assert.deepEqual(statuses, [200, 409]);

  const seated = portal.db.raw.prepare("SELECT guest_id FROM team_picks WHERE team_name = ?").all(BARN_BURNERS);

  assert.equal(seated.length, 1);
});

test("does refuse with picks_closed and leave the row alone when Brad has closed picks", async () => {
  const portal = portalWithGuests();
  const cookie = await portal.signInAs("g_rob");

  await pickTeam(portal, cookie, IRON_HENS);
  portal.db.raw.prepare("INSERT INTO settings (key, value) VALUES ('picks_closed', '1')").run();

  const refused = await pickTeam(portal, cookie, MIRROR_BALLS);

  assert.equal(refused.status, 409);
  assert.deepEqual(await refused.json(), { error: "picks_closed" });
  assert.equal(readPickRow(portal, "g_rob")?.team_name, IRON_HENS);
  assert.equal((await readMe(portal, cookie)).picksClosed, true);
  assert.equal((await readTeams(portal, cookie)).picksClosed, true);
});

test("does refuse with bad_request when the pick names a team the roster lacks or is not a pick", async () => {
  const portal = portalWithGuests();
  const cookie = await portal.signInAs("g_rob");

  for (const body of [{ teamName: "Hens of Iron" }, { teamName: "iron hens" }, { teamName: "" }, { team: IRON_HENS }, "x"]) {
    const response = await portal.request("PUT", "/api/me/team", { cookie, body });

    assert.equal(response.status, 400, JSON.stringify(body));
    assert.deepEqual(await response.json(), { error: "bad_request" });
  }

  assert.equal(readPickRow(portal, "g_rob"), undefined);
});

test("does keep the outfit for the team's genre and answer with every genre's when a guest dresses their bird", async () => {
  const portal = portalWithGuests();
  const cookie = await portal.signInAs("g_rob");

  await pickTeam(portal, cookie, IRON_HENS);
  portal.db.raw
    .prepare("UPDATE team_picks SET outfits_json = ? WHERE guest_id = 'g_rob'")
    .run(JSON.stringify({ disco: { tail: { item: "tinsel-a" } } }));

  const response = await saveOutfit(portal, cookie, { genre: "metal", outfit: THRASH });
  const saved = (await response.json()) as PortalOutfitSaved;
  const expected = { disco: { tail: { item: "tinsel-a" } }, metal: THRASH };

  assert.equal(response.status, 200);
  assert.deepEqual(saved.team, { teamName: IRON_HENS, outfitsByGenre: expected });
  assert.deepEqual(JSON.parse(readPickRow(portal, "g_rob")?.outfits_json ?? ""), expected);
  assert.deepEqual((await readMe(portal, cookie)).team?.outfitsByGenre, expected);
});

test("does replace the genre's whole outfit, keeping an emptied genre as {}, when the guest strips their bird", async () => {
  const portal = portalWithGuests();
  const cookie = await portal.signInAs("g_rob");

  await pickTeam(portal, cookie, IRON_HENS);
  await saveOutfit(portal, cookie, { genre: "metal", outfit: THRASH });
  await saveOutfit(portal, cookie, { genre: "metal", outfit: { top: { item: "battle-vest-a" } } });

  assert.deepEqual((await readMe(portal, cookie)).team?.outfitsByGenre, { metal: { top: { item: "battle-vest-a" } } });

  const cleared = await saveOutfit(portal, cookie, { genre: "metal", outfit: {} });

  assert.equal(cleared.status, 200);
  assert.deepEqual(((await cleared.json()) as PortalOutfitSaved).team.outfitsByGenre, { metal: {} });
  assert.equal(readPickRow(portal, "g_rob")?.outfits_json, '{"metal":{}}');
});

test("does keep each genre's outfit when the guest switches teams and dresses for the other", async () => {
  const portal = portalWithGuests();
  const cookie = await portal.signInAs("g_rob");

  await pickTeam(portal, cookie, IRON_HENS);
  await saveOutfit(portal, cookie, { genre: "metal", outfit: THRASH });
  await pickTeam(portal, cookie, MIRROR_BALLS);
  await saveOutfit(portal, cookie, { genre: "disco", outfit: { tail: { item: "tinsel-a" } } });
  await pickTeam(portal, cookie, IRON_HENS);

  assert.deepEqual((await readMe(portal, cookie)).team, {
    teamName: IRON_HENS,
    outfitsByGenre: { metal: THRASH, disco: { tail: { item: "tinsel-a" } } }
  });
});

test("does refuse with outfit_invalid and write nothing when the outfit is not one the genre's wardrobe has", async () => {
  const portal = portalWithGuests();
  const cookie = await portal.signInAs("g_rob");

  await pickTeam(portal, cookie, IRON_HENS);

  for (const outfit of [
    { hat: { item: "battle-vest-a" } },
    { top: { item: "no-such-thing" } },
    { sleeve: { item: "battle-vest-a" } },
    { tail: { item: "tinsel-a" } },
    { prop: { item: "flying-v-a", style: "team" } },
    { top: "battle-vest-a" }
  ]) {
    const response = await saveOutfit(portal, cookie, { genre: "metal", outfit });

    assert.equal(response.status, 400, JSON.stringify(outfit));
    assert.deepEqual(await response.json(), { error: "outfit_invalid" });
  }

  // Country's bird shows no shank, so it has no Boots slot at all.
  await pickTeam(portal, cookie, BARN_BURNERS);

  const boots = await saveOutfit(portal, cookie, { genre: "country", outfit: { boots: { item: "combat-boots-a" } } });

  assert.equal(boots.status, 400);
  assert.equal(readPickRow(portal, "g_rob")?.outfits_json, "{}");
});

test("does refuse with bad_request when the body is not a genre and an outfit", async () => {
  const portal = portalWithGuests();
  const cookie = await portal.signInAs("g_rob");

  await pickTeam(portal, cookie, IRON_HENS);

  for (const body of [{ outfit: {} }, { genre: "Metal", outfit: {} }, { genre: "metal", outfit: [] }, "x"]) {
    const response = await saveOutfit(portal, cookie, body);

    assert.equal(response.status, 400, JSON.stringify(body));
    assert.deepEqual(await response.json(), { error: "bad_request" });
  }
});

test("does refuse with too_large and read nothing when the body is past the cap", async () => {
  const portal = portalWithGuests();
  const cookie = await portal.signInAs("g_rob");

  await pickTeam(portal, cookie, IRON_HENS);

  const padded = { genre: "metal", outfit: { top: { item: "battle-vest-a" } }, pad: "x".repeat(2100) };
  const response = await saveOutfit(portal, cookie, padded);

  assert.equal(response.status, 413);
  assert.deepEqual(await response.json(), { error: "too_large" });
  assert.equal(readPickRow(portal, "g_rob")?.outfits_json, "{}");
});

test("does refuse with no_team when the guest has no team, an orphaned one, or one of another genre", async () => {
  const portal = portalWithGuests();
  const cookie = await portal.signInAs("g_rob");

  const unseated = await saveOutfit(portal, cookie, { genre: "metal", outfit: THRASH });

  assert.equal(unseated.status, 409);
  assert.deepEqual(await unseated.json(), { error: "no_team" });

  // A page left open on the metal wardrobe after the guest moved to disco.
  await pickTeam(portal, cookie, MIRROR_BALLS);

  const stale = await saveOutfit(portal, cookie, { genre: "metal", outfit: THRASH });

  assert.equal(stale.status, 409);
  assert.equal(readPickRow(portal, "g_rob")?.outfits_json, "{}");

  portal.db.raw.prepare("UPDATE team_picks SET team_name = 'Gone Team' WHERE guest_id = 'g_rob'").run();

  assert.equal((await saveOutfit(portal, cookie, { genre: "disco", outfit: {} })).status, 409);
});

test("does keep the wardrobe open when Brad has closed picks", async () => {
  const portal = portalWithGuests();
  const cookie = await portal.signInAs("g_rob");

  await pickTeam(portal, cookie, IRON_HENS);
  portal.db.raw.prepare("INSERT INTO settings (key, value) VALUES ('picks_closed', '1')").run();

  assert.equal((await saveOutfit(portal, cookie, { genre: "metal", outfit: THRASH })).status, 200);
});

test("does show each member in the outfit for their team's genre, read tolerantly, when the teams are read", async () => {
  const portal = portalWithGuests();
  const robCookie = await portal.signInAs("g_rob");
  const anaCookie = await portal.signInAs("g_ana");

  await pickTeam(portal, robCookie, IRON_HENS);
  await pickTeam(portal, anaCookie, MIRROR_BALLS);
  // Rob dressed for metal and disco and wears an item cut since; Ana only ever dressed for metal.
  portal.db.raw
    .prepare("UPDATE team_picks SET outfits_json = ? WHERE guest_id = 'g_rob'")
    .run(JSON.stringify({ metal: { ...THRASH, tail: { item: "cut-since" } }, disco: { tail: { item: "tinsel-a" } } }));
  portal.db.raw
    .prepare("UPDATE team_picks SET outfits_json = ? WHERE guest_id = 'g_ana'")
    .run(JSON.stringify({ metal: THRASH }));

  const teams = (await readTeams(portal, robCookie)).teams;

  // Read as worn: the cut tail is gone and every choice carries its style, the default when none.
  assert.deepEqual(teams[0]?.members, [
    { guestId: "g_rob", displayName: "Rob", headHash: null, outfit: { ...THRASH, top: { item: "battle-vest-a", style: "ink" } } }
  ]);
  assert.deepEqual(teams[1]?.members, [{ guestId: "g_ana", displayName: "Ana", headHash: null }]);
});

test("does read a pick the guard no longer accepts as no pick when /api/me is read", async () => {
  const portal = portalWithGuests();
  const cookie = await portal.signInAs("g_rob");

  portal.db.raw
    .prepare("INSERT INTO team_picks (guest_id, team_name, outfits_json, updated_at) VALUES ('g_rob', ?, 'not json', 1)")
    .run(IRON_HENS);

  assert.equal((await readMe(portal, cookie)).team, null);
});

test("does answer server_error on the team routes, and still /api/me, when the deploy shipped no roster", async () => {
  const portal = portalWithGuests({ roster: null });
  const cookie = await portal.signInAs("g_rob");

  for (const [method, path] of [
    ["GET", "/api/teams"],
    ["PUT", "/api/me/team"]
  ] as const) {
    const response = await portal.request(method, path, {
      cookie,
      ...(method === "PUT" ? { body: { teamName: IRON_HENS } } : {})
    });

    assert.equal(response.status, 500, `${method} ${path}`);
    assert.deepEqual(await response.json(), { error: "server_error" });
  }

  assert.ok(portal.errors.some((message) => /teaser-roster\.json is missing/.test(message)));
  assert.equal((await portal.request("GET", "/api/me", { cookie })).status, 200);
});

test("does answer server_error when the roster the deploy shipped is malformed", async () => {
  const portal = portalWithGuests({ roster: { players: [], teams: [{ id: "team-1" }] } });
  const response = await portal.request("GET", "/api/teams", { cookie: await portal.signInAs("g_rob") });

  assert.equal(response.status, 500);
  assert.ok(portal.errors.some((message) => /not a roster/.test(message)));
});

test("does serve another guest's kept head, and 404 before there is one, when a guest reads it", async () => {
  const portal = portalWithGuests();
  const cookie = await portal.signInAs("g_rob");

  assert.equal((await portal.request("GET", "/api/guests/g_ana/avatar", { cookie })).status, 404);
  assert.equal((await portal.request("GET", "/api/guests/g_nobody/avatar", { cookie })).status, 404);

  await giveHead(portal, "g_ana", "b".repeat(64));

  const head = await portal.request("GET", "/api/guests/g_ana/avatar", { cookie });

  assert.equal(head.status, 200);
  assert.equal(head.headers.get("Content-Type"), "image/png");
  assert.equal(head.headers.get("ETag"), `"${"b".repeat(64)}"`);
  assert.equal((await head.arrayBuffer()).byteLength, atob(FAKE_HEAD_PNG_BASE64).length);
});

test("does report a head when the guest has an accepted avatar attempt", async () => {
  const portal = portalWithGuests();
  const cookie = await portal.signInAs("g_rob");

  portal.db.raw
    .prepare(
      `INSERT INTO avatar_attempts (attempt_id, guest_id, created_at, status, object_key, head_hash, accepted_at)
       VALUES ('a_1', 'g_rob', 1, 'painted', 'avatars/g_rob/head.png', 'abc123', 2)`
    )
    .run();

  const me = await readMe(portal, cookie);

  assert.equal(me.hasHead, true);
  assert.deepEqual(me.avatar, { triesMax: 5, triesLeft: 4, hasPhoto: false, headHash: "abc123" });
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
