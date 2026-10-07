import assert from "node:assert/strict";
import test from "node:test";

import type {
  AdminGuestStatus,
  AdminInviteAllResult,
  AdminMintedLink,
  AdminStyleReference,
  AdminVoteSummary
} from "@wingnight/shared/guestPortal";

import { STYLE_REFERENCE_KEY, resolveHeadKey } from "../avatarStore/index.ts";
import { FAKE_HEAD_PNG_BASE64 } from "../headPainter/fakeHead.ts";
import {
  ADMIN_API_TOKEN,
  createTestPortal,
  readSessionCookie,
  readSignInPath,
  type TestPortal
} from "../testing/harness/index.ts";
import { mintEmailLink, mintPersonalLink } from "../signInLinks/index.ts";
import { INVITE_ALL_BATCH_SIZE } from "./index.ts";

const ADMIN_ROUTES: { method: string; path: string; body?: unknown }[] = [
  { method: "GET", path: "/api/admin/guests" },
  { method: "POST", path: "/api/admin/guests", body: { displayName: "Kim", email: null } },
  { method: "PATCH", path: "/api/admin/guests/g_rob", body: { displayName: "Robert" } },
  { method: "POST", path: "/api/admin/guests/g_rob/invite" },
  { method: "POST", path: "/api/admin/guests/g_rob/link" },
  { method: "POST", path: "/api/admin/guests/g_rob/sign-out" },
  { method: "POST", path: "/api/admin/invites" },
  { method: "GET", path: "/api/admin/votes" }
];

const BEARER = { Authorization: `Bearer ${ADMIN_API_TOKEN}` };

const portalWithGuests = (options?: Parameters<typeof createTestPortal>[0]): TestPortal => {
  const portal = createTestPortal(options);

  portal.addGuest({ guestId: "g_brad", displayName: "Brad", email: "brad@example.com", isAdmin: true });
  portal.addGuest({ guestId: "g_rob", displayName: "Rob", email: "rob@example.com" });

  return portal;
};

test("does answer 403 on every admin route when the session is not an admin's", async () => {
  const portal = portalWithGuests();
  const cookie = await portal.signInAs("g_rob");

  for (const { method, path, body } of ADMIN_ROUTES) {
    const response = await portal.request(method, path, { cookie, body });

    assert.equal(response.status, 403, `${method} ${path}`);
    assert.deepEqual(await response.json(), { error: "forbidden" });
  }

  for (const { method, path, body } of ADMIN_ROUTES) {
    assert.equal((await portal.request(method, path, { body })).status, 403, `anonymous ${method} ${path}`);
  }

  assert.equal(portal.mail.sent.length, 0);
});

test("does let every admin route through when the session is an admin's", async () => {
  const portal = portalWithGuests();
  const cookie = await portal.signInAs("g_brad");

  for (const { method, path, body } of ADMIN_ROUTES) {
    const response = await portal.request(method, path, { cookie, body });

    assert.ok(response.status < 300, `${method} ${path} answered ${response.status}`);
  }
});

test("does let every admin route through when the bearer token is sent without an Origin", async () => {
  const portal = portalWithGuests();

  for (const { method, path, body } of ADMIN_ROUTES) {
    const response = await portal.request(method, path, { body, origin: null, headers: BEARER });

    assert.ok(response.status < 300, `${method} ${path} answered ${response.status}`);
  }
});

test("does refuse a wrong bearer even when an admin cookie rides along", async () => {
  const portal = portalWithGuests();
  const cookie = await portal.signInAs("g_brad");
  const response = await portal.request("GET", "/api/admin/guests", {
    cookie,
    headers: { Authorization: "Bearer not-the-token" }
  });

  assert.equal(response.status, 403);
});

test("does refuse every bearer when no admin token is configured", async () => {
  const portal = portalWithGuests({ adminApiToken: null });
  const response = await portal.request("GET", "/api/admin/guests", { headers: BEARER });

  assert.equal(response.status, 403);
});

test("does list every guest's sign-in, head and vote status when the admin reads the guest list", async () => {
  const portal = portalWithGuests();
  const robCookie = await portal.signInAs("g_rob");

  await portal.request("PUT", "/api/me/vote", {
    cookie: robCookie,
    body: { genreRanking: ["pop"], teammateWishes: [], teamFormat: "guests_pick" }
  });

  const guests = (await (
    await portal.request("GET", "/api/admin/guests", { headers: BEARER })
  ).json()) as AdminGuestStatus[];
  const rob = guests.find((guest) => guest.guestId === "g_rob");

  assert.deepEqual(rob, {
    guestId: "g_rob",
    displayName: "Rob",
    email: "rob@example.com",
    isAdmin: false,
    createdAt: portal.clock.now,
    invitedAt: null,
    claimedAt: null,
    lastSeenAt: null,
    hasHead: false,
    headHash: null,
    isStyleReference: false,
    triesLeft: 5,
    hasVoted: true
  });
});

test("does refuse an address when another guest already has it, and otherwise add and edit guests", async () => {
  const portal = portalWithGuests();
  const created = await portal.request("POST", "/api/admin/guests", {
    headers: BEARER,
    body: { displayName: "  Kim  ", email: "Kim@Example.com" }
  });

  assert.equal(created.status, 201);

  const kim = (await created.json()) as AdminGuestStatus;

  assert.equal(kim.displayName, "Kim");
  assert.equal(kim.email, "kim@example.com");
  assert.match(kim.guestId, /^g_[A-Za-z0-9_-]{16}$/);

  const taken = await portal.request("PATCH", `/api/admin/guests/${kim.guestId}`, {
    headers: BEARER,
    body: { email: "rob@example.com" }
  });

  assert.equal(taken.status, 409);

  const edited = await portal.request("PATCH", `/api/admin/guests/${kim.guestId}`, {
    headers: BEARER,
    body: { displayName: "Kimberly", email: null }
  });

  assert.deepEqual(
    { ...((await edited.json()) as AdminGuestStatus) },
    { ...kim, displayName: "Kimberly", email: null }
  );
  assert.equal(
    (await portal.request("PATCH", "/api/admin/guests/g_nobody", { headers: BEARER, body: { displayName: "X" } }))
      .status,
    404
  );
});

test("does email a fresh personal link and stamp the invite when a guest is invited", async () => {
  const portal = portalWithGuests();
  const response = await portal.request("POST", "/api/admin/guests/g_rob/invite", { headers: BEARER });

  assert.equal(response.status, 200);
  assert.equal(portal.mail.sent.length, 1);
  assert.equal(portal.mail.sent[0]?.to, "rob@example.com");
  assert.equal(portal.db.raw.prepare("SELECT invited_at FROM guests WHERE guest_id = 'g_rob'").get()?.invited_at, portal.clock.now);

  const firstLink = readSignInPath(portal.mail.sent[0]?.text ?? "");

  await portal.request("POST", "/api/admin/guests/g_rob/invite", { headers: BEARER });

  const secondLink = readSignInPath(portal.mail.sent[1]?.text ?? "");

  assert.equal((await portal.request("POST", firstLink)).status, 400);
  assert.equal((await portal.request("POST", secondLink)).status, 303);
});

test("does refuse the invite when the guest has no address", async () => {
  const portal = portalWithGuests();

  portal.addGuest({ guestId: "g_kim", displayName: "Kim" });

  assert.equal((await portal.request("POST", "/api/admin/guests/g_kim/invite", { headers: BEARER })).status, 409);
});

test("does answer 502 and leave the guest uninvited when the invite mail fails", async () => {
  const portal = portalWithGuests();

  portal.deps.mail = {
    send: async () => {
      throw new Error("down");
    }
  };

  const response = await portal.request("POST", "/api/admin/guests/g_rob/invite", { headers: BEARER });

  assert.equal(response.status, 502);
  assert.equal(portal.db.raw.prepare("SELECT invited_at FROM guests WHERE guest_id = 'g_rob'").get()?.invited_at, null);
});

test("does invite the uninvited with addresses in batches when everyone is invited", async () => {
  const portal = portalWithGuests();

  portal.addGuest({ guestId: "g_noemail", displayName: "No Email" });

  for (let index = 0; index < INVITE_ALL_BATCH_SIZE; index += 1) {
    portal.addGuest({ guestId: `g_extra${index}`, displayName: `Extra ${index}`, email: `extra${index}@example.com` });
  }

  const first = (await (await portal.request("POST", "/api/admin/invites", { headers: BEARER })).json()) as AdminInviteAllResult;

  // Rob and ten extras have addresses (Brad does too, but he is the admin): eleven, ten a press.
  assert.equal(first.invited.length, INVITE_ALL_BATCH_SIZE);
  assert.equal(first.remaining, 1);

  const second = (await (await portal.request("POST", "/api/admin/invites", { headers: BEARER })).json()) as AdminInviteAllResult;

  assert.equal(second.invited.length, 1);
  assert.equal(second.remaining, 0);
  assert.ok(![...first.invited, ...second.invited].includes("g_noemail"));
  assert.ok(![...first.invited, ...second.invited].includes("g_brad"));
  assert.equal(portal.mail.sent.length, INVITE_ALL_BATCH_SIZE + 1);
});

test("does return a working link once when the admin mints one to text", async () => {
  const portal = portalWithGuests();
  const minted = (await (
    await portal.request("POST", "/api/admin/guests/g_rob/link", { headers: BEARER })
  ).json()) as AdminMintedLink;

  assert.equal(minted.guestId, "g_rob");
  assert.match(minted.url, /^https:\/\/wingnight\.tv\/s\/[A-Za-z0-9_-]{43}$/);
  assert.equal(portal.mail.sent.length, 0);

  const signIn = await portal.request("POST", new URL(minted.url).pathname);
  const me = await portal.request("GET", "/api/me", { cookie: readSessionCookie(signIn) });

  assert.equal(((await me.json()) as { guestId: string }).guestId, "g_rob");
});

test("does pair mutual wishes and name non-voters when the admin reads the vote summary", async () => {
  const portal = portalWithGuests();

  portal.addGuest({ guestId: "g_ana", displayName: "Ana" });

  const vote = async (guestId: string, body: unknown) =>
    portal.request("PUT", "/api/me/vote", { cookie: await portal.signInAs(guestId), body });

  await vote("g_rob", { genreRanking: ["metal", "pop"], teammateWishes: ["g_ana"], teamFormat: "guests_pick" });
  await vote("g_ana", { genreRanking: ["pop"], teammateWishes: ["g_rob", "g_brad"], teamFormat: "guests_pick" });

  const summary = (await (await portal.request("GET", "/api/admin/votes", { headers: BEARER })).json()) as AdminVoteSummary;

  assert.equal(summary.voterCount, 2);
  assert.equal(summary.genreTallies[0]?.genre, "pop");
  assert.deepEqual(summary.mutualWishes, [
    { guests: [{ guestId: "g_ana", displayName: "Ana" }, { guestId: "g_rob", displayName: "Rob" }] }
  ]);
  assert.equal(summary.formatTallies.guests_pick, 2);
  assert.deepEqual(summary.notVoted, [{ guestId: "g_brad", displayName: "Brad" }]);
});

test("does reach the guests behind the first batch when the first batch's mail keeps failing", async () => {
  const portal = portalWithGuests();

  // Sorted by id, these ten come first and their mail is refused every time.
  for (let index = 0; index < INVITE_ALL_BATCH_SIZE; index += 1) {
    portal.addGuest({ guestId: `g_bad${index}`, displayName: `Bad ${index}`, email: `bad${index}@example.com` });
  }

  portal.deps.mail = {
    send: async (message) => {
      if (message.to.startsWith("bad")) {
        throw new Error("Resend refused the message: 422.");
      }

      portal.mail.sent.push(message);
    }
  };

  for (let press = 0; press < 3; press += 1) {
    await portal.request("POST", "/api/admin/invites", { headers: BEARER });
  }

  // Brad is the admin, so invite-everyone never mails him.
  assert.deepEqual(portal.mail.sent.map(({ to }) => to).sort(), ["rob@example.com"]);
});

test("does count the guests whose mail failed as remaining when everyone is invited", async () => {
  const portal = portalWithGuests();

  portal.addGuest({ guestId: "g_bounce", displayName: "Bounce", email: "bounce@example.com" });
  portal.deps.mail = {
    send: async (message) => {
      if (message.to.startsWith("bounce")) {
        throw new Error("Resend refused the message: 422.");
      }
    }
  };

  const result = (await (await portal.request("POST", "/api/admin/invites", { headers: BEARER })).json()) as AdminInviteAllResult;

  assert.deepEqual(result, { invited: ["g_rob"], failed: ["g_bounce"], remaining: 1 });
  assert.equal(
    portal.db.raw.prepare("SELECT last_invite_attempt_at FROM guests WHERE guest_id = 'g_bounce'").get()?.last_invite_attempt_at,
    portal.clock.now
  );
});

test("does shut out every link and session when an admin changes a guest's address", async () => {
  const portal = portalWithGuests();
  const personalToken = await mintPersonalLink(portal.deps, "g_rob");
  const emailToken = (await mintEmailLink(portal.deps, "g_rob", "ip-hash")) ?? assert.fail("capped");
  const cookie = await portal.signInAs("g_rob");

  const renamed = await portal.request("PATCH", "/api/admin/guests/g_rob", { headers: BEARER, body: { displayName: "Robert" } });

  assert.equal(renamed.status, 200);
  assert.equal((await portal.request("GET", "/api/me", { cookie })).status, 200, "a rename alone evicts nobody");

  const moved = await portal.request("PATCH", "/api/admin/guests/g_rob", { headers: BEARER, body: { email: "rob@new.example" } });

  assert.equal(moved.status, 200);
  assert.equal((await portal.request("GET", "/api/me", { cookie })).status, 401);
  assert.equal((await portal.request("POST", `/s/${personalToken}`)).status, 400);
  assert.equal((await portal.request("POST", `/s/${emailToken}`)).status, 400);
});

test("does end only that guest's sessions when an admin signs them out", async () => {
  const portal = portalWithGuests();
  const robPhone = await portal.signInAs("g_rob");
  const robLaptop = await portal.signInAs("g_rob");
  const bradCookie = await portal.signInAs("g_brad");
  const response = await portal.request("POST", "/api/admin/guests/g_rob/sign-out", { cookie: bradCookie });

  assert.deepEqual(await response.json(), { guestId: "g_rob", sessionsEnded: 2 });
  assert.equal((await portal.request("GET", "/api/me", { cookie: robPhone })).status, 401);
  assert.equal((await portal.request("GET", "/api/me", { cookie: robLaptop })).status, 401);
  assert.equal((await portal.request("GET", "/api/me", { cookie: bradCookie })).status, 200);
  assert.equal(
    (await portal.request("POST", "/api/admin/guests/g_nobody/sign-out", { cookie: bradCookie })).status,
    404
  );
});

test("does keep a guest's sessions when a fresh link is minted for them", async () => {
  const portal = portalWithGuests();
  const cookie = await portal.signInAs("g_rob");

  await portal.request("POST", "/api/admin/guests/g_rob/link", { headers: BEARER });

  assert.equal((await portal.request("GET", "/api/me", { cookie })).status, 200);
});

// An accepted head, as the studio leaves one: the PNG in R2 and the accepted try in D1.
const giveHead = async (portal: TestPortal, guestId: string, headHash: string): Promise<void> => {
  await portal.bucket.put(
    resolveHeadKey(guestId),
    Uint8Array.from(atob(FAKE_HEAD_PNG_BASE64), (character) => character.charCodeAt(0))
  );
  portal.db.raw
    .prepare(
      `INSERT INTO avatar_attempts (attempt_id, guest_id, created_at, status, object_key, head_hash, accepted_at)
       VALUES (?, ?, ?, 'painted', ?, ?, ?)`
    )
    .run(`a_${guestId}`, guestId, portal.clock.now, resolveHeadKey(guestId), headHash, portal.clock.now);
};

test("does let only an admin pick the style reference, and only from a guest with a head", async () => {
  const portal = portalWithGuests();
  const robCookie = await portal.signInAs("g_rob");
  const bradCookie = await portal.signInAs("g_brad");
  const pick = (cookie: string, guestId: string) =>
    portal.request("POST", "/api/admin/style-reference", { cookie, body: { guestId } });

  assert.equal((await pick(bradCookie, "g_rob")).status, 404, "Rob has no head yet");

  await giveHead(portal, "g_rob", "f".repeat(64));

  const refused = await pick(robCookie, "g_rob");

  assert.equal(refused.status, 403);
  assert.deepEqual(await refused.json(), { error: "forbidden" });
  assert.equal(portal.bucket.readText(STYLE_REFERENCE_KEY), null, "a guest's press stored nothing");
  assert.equal((await pick(bradCookie, "")).status, 400);

  const picked = await pick(bradCookie, "g_rob");

  assert.equal(picked.status, 200);
  assert.deepEqual((await picked.json()) as AdminStyleReference, {
    guestId: "g_rob",
    headHash: "f".repeat(64),
    pickedAt: portal.clock.now
  });
  assert.equal(portal.bucket.readText(STYLE_REFERENCE_KEY), FAKE_HEAD_PNG_BASE64, "kept as the base64 Gemini takes");
  assert.deepEqual((await portal.bucket.head(STYLE_REFERENCE_KEY))?.customMetadata, {
    mimeType: "image/png",
    guestId: "g_rob",
    headHash: "f".repeat(64)
  });

  const guests = (await (await portal.request("GET", "/api/admin/guests", { cookie: bradCookie })).json()) as AdminGuestStatus[];

  assert.deepEqual(
    guests.map(({ guestId, hasHead, headHash, isStyleReference }) => ({ guestId, hasHead, headHash, isStyleReference })),
    [
      { guestId: "g_brad", hasHead: false, headHash: null, isStyleReference: false },
      { guestId: "g_rob", hasHead: true, headHash: "f".repeat(64), isStyleReference: true }
    ]
  );
});
