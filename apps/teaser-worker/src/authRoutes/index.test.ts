import assert from "node:assert/strict";
import test from "node:test";

import { mintPersonalLink, mintEmailLink as mintCappedEmailLink, EMAIL_LINK_TTL_MS } from "../signInLinks/index.ts";
import { SESSION_TTL_MS } from "../sessions/index.ts";
import {
  createTestPortal,
  readSessionCookie,
  readSignInPath,
  type TestPortal
} from "../testing/harness/index.ts";
import { EMAIL_LINK_ACCEPTED_BODY, EMAIL_LINKS_PER_ADDRESS_PER_HOUR } from "./index.ts";

// An emailed link for a test that is nowhere near the per-address cap.
const mintEmailLink = async (...args: Parameters<typeof mintCappedEmailLink>): Promise<string> =>
  (await mintCappedEmailLink(...args)) ?? assert.fail("the per-address cap refused the link");

const ROB = { guestId: "g_rob", displayName: "Rob", email: "rob@example.com" };

const portalWithRob = (options?: Parameters<typeof createTestPortal>[0]): TestPortal => {
  const portal = createTestPortal(options);

  portal.addGuest(ROB);

  return portal;
};

const requestEmailLink = async (portal: TestPortal, email: string, ip = "203.0.113.7"): Promise<Response> => {
  const response = await portal.request("POST", "/api/auth/email-link", {
    body: { email },
    headers: { "CF-Connecting-IP": ip }
  });

  await portal.settle();

  return response;
};

const snapshot = async (response: Response) => ({
  status: response.status,
  headers: [...response.headers.entries()],
  body: await response.text()
});

const countRows = (portal: TestPortal, table: string): number => {
  return Number((portal.db.raw.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n);
};

test("does sign a guest in and send them to their page when a personal link is posted", async () => {
  const portal = portalWithRob();
  const token = await mintPersonalLink(portal.deps, ROB.guestId);
  const response = await portal.request("POST", `/s/${token}`);

  assert.equal(response.status, 303);
  assert.equal(response.headers.get("Location"), "/me");

  const me = await portal.request("GET", "/api/me", { cookie: readSessionCookie(response) });

  assert.equal(me.status, 200);
  assert.equal(((await me.json()) as { guestId: string }).guestId, ROB.guestId);

  const guest = portal.db.raw.prepare("SELECT claimed_at, last_seen_at FROM guests WHERE guest_id = ?").get(ROB.guestId);

  assert.equal(guest?.claimed_at, portal.clock.now);
  assert.equal(guest?.last_seen_at, portal.clock.now);
});

test("does set an HttpOnly, Secure, Lax, site-wide six-week cookie when a guest signs in", async () => {
  const portal = portalWithRob();
  const token = await mintPersonalLink(portal.deps, ROB.guestId);
  const setCookie = (await portal.request("POST", `/s/${token}`)).headers.get("Set-Cookie") ?? "";
  const attributes = setCookie.split(";").map((part) => part.trim());

  assert.match(attributes[0] ?? "", /^wn_session=[A-Za-z0-9_-]{43}$/);
  assert.ok(attributes.includes("HttpOnly"));
  assert.ok(attributes.includes("Secure"));
  assert.ok(attributes.includes("SameSite=Lax"));
  assert.ok(attributes.includes("Path=/"));
  assert.ok(attributes.includes(`Max-Age=${SESSION_TTL_MS / 1000}`));
  assert.ok(!attributes.some((attribute) => attribute.startsWith("Domain=")));
});

test("does keep only hashes at rest when links and sessions are minted", async () => {
  const portal = portalWithRob();
  const personalToken = await mintPersonalLink(portal.deps, ROB.guestId);
  const emailToken = await mintEmailLink(portal.deps, ROB.guestId, "ip-hash");
  const cookie = readSessionCookie(await portal.request("POST", `/s/${personalToken}`));
  const sessionToken = cookie.slice("wn_session=".length);
  const rawRows = JSON.stringify([
    portal.db.raw.prepare("SELECT * FROM personal_links").all(),
    portal.db.raw.prepare("SELECT * FROM email_tokens").all(),
    portal.db.raw.prepare("SELECT * FROM sessions").all()
  ]);

  for (const plaintext of [personalToken, emailToken, sessionToken]) {
    assert.ok(!rawRows.includes(plaintext), "a plaintext token was stored");
  }

  for (const table of ["personal_links", "email_tokens"]) {
    const hashes = portal.db.raw.prepare(`SELECT token_hash AS hash FROM ${table}`).all() as { hash: string }[];

    assert.ok(hashes.every(({ hash }) => /^[0-9a-f]{64}$/.test(hash)));
  }

  assert.match(
    String(portal.db.raw.prepare("SELECT session_hash FROM sessions").get()?.session_hash),
    /^[0-9a-f]{64}$/
  );
});

test("does refuse an emailed link the second time when it is posted twice", async () => {
  const portal = portalWithRob();
  const token = await mintEmailLink(portal.deps, ROB.guestId, "ip-hash");

  assert.equal((await portal.request("POST", `/s/${token}`)).status, 303);

  const second = await portal.request("POST", `/s/${token}`);

  assert.equal(second.status, 400);
  assert.equal(second.headers.get("Set-Cookie"), null);
  assert.match(await second.text(), /Email me a new link/);
});

test("does refuse an emailed link when thirty minutes have passed", async () => {
  const portal = portalWithRob();
  const token = await mintEmailLink(portal.deps, ROB.guestId, "ip-hash");

  portal.clock.now += EMAIL_LINK_TTL_MS;

  assert.equal((await portal.request("POST", `/s/${token}`)).status, 400);
});

test("does accept an emailed link when it is a minute from expiring", async () => {
  const portal = portalWithRob();
  const token = await mintEmailLink(portal.deps, ROB.guestId, "ip-hash");

  portal.clock.now += EMAIL_LINK_TTL_MS - 60_000;

  assert.equal((await portal.request("POST", `/s/${token}`)).status, 303);
});

test("does keep a personal link working when it is used on a second device", async () => {
  const portal = portalWithRob();
  const token = await mintPersonalLink(portal.deps, ROB.guestId);

  assert.equal((await portal.request("POST", `/s/${token}`)).status, 303);
  assert.equal((await portal.request("POST", `/s/${token}`)).status, 303);
});

test("does revoke the old personal link when a new one is minted", async () => {
  const portal = portalWithRob();
  const oldToken = await mintPersonalLink(portal.deps, ROB.guestId);
  const newToken = await mintPersonalLink(portal.deps, ROB.guestId);

  assert.equal((await portal.request("POST", `/s/${oldToken}`)).status, 400);
  assert.equal((await portal.request("POST", `/s/${newToken}`)).status, 303);
  assert.equal(
    portal.db.raw.prepare("SELECT COUNT(*) AS n FROM personal_links WHERE revoked_at IS NULL").get()?.n,
    1
  );
});

test("does neither burn nor read a token when its link is fetched with GET", async () => {
  const portal = portalWithRob();
  const token = await mintEmailLink(portal.deps, ROB.guestId, "ip-hash");
  const realDb = portal.deps.db;
  let queryCount = 0;

  portal.deps.db = {
    ...realDb,
    prepare: (sql) => {
      queryCount += 1;

      return realDb.prepare(sql);
    }
  };

  for (let fetchCount = 0; fetchCount < 3; fetchCount += 1) {
    const page = await portal.request("GET", `/s/${token}`, { origin: null });

    assert.equal(page.status, 200);
    assert.equal(page.headers.get("Set-Cookie"), null);
    assert.match(page.headers.get("Content-Type") ?? "", /^text\/html/);
    assert.match(await page.text(), /<form method="post">/);
  }

  assert.equal(queryCount, 0);
  assert.equal(portal.db.raw.prepare("SELECT used_at FROM email_tokens").get()?.used_at, null);
  assert.equal(countRows(portal, "sessions"), 0);
  assert.equal((await portal.request("POST", `/s/${token}`)).status, 303);
});

test("does show the expired page when a link that was never minted is posted", async () => {
  const portal = portalWithRob();
  const response = await portal.request("POST", "/s/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");

  assert.equal(response.status, 400);
  assert.equal(countRows(portal, "sessions"), 0);
});

test("does email a single-use sign-in link when a known address asks for one", async () => {
  const portal = portalWithRob();
  const response = await requestEmailLink(portal, "  ROB@example.com ");

  assert.equal(response.status, 202);
  assert.equal(portal.mail.sent.length, 1);
  assert.equal(portal.mail.sent[0]?.to, ROB.email);

  const signIn = await portal.request("POST", readSignInPath(portal.mail.sent[0]?.text ?? ""));

  assert.equal(signIn.status, 303);
});

test("does answer byte for byte alike when the address is known, unknown or rate-limited", async () => {
  const portal = portalWithRob({ ipLimit: 1 });
  const known = await snapshot(await requestEmailLink(portal, ROB.email, "198.51.100.1"));
  const unknown = await snapshot(await requestEmailLink(portal, "stranger@example.com", "198.51.100.2"));
  const rateLimited = await snapshot(await requestEmailLink(portal, ROB.email, "198.51.100.1"));

  assert.deepEqual(unknown, known);
  assert.deepEqual(rateLimited, known);
  assert.equal(known.status, 202);
  assert.equal(known.body, JSON.stringify(EMAIL_LINK_ACCEPTED_BODY));
  assert.equal(portal.mail.sent.length, 1);
});

test("does stop sending when one IP asks too often", async () => {
  const portal = portalWithRob({ ipLimit: 2 });

  portal.addGuest({ guestId: "g_ana", displayName: "Ana", email: "ana@example.com" });
  portal.addGuest({ guestId: "g_kim", displayName: "Kim", email: "kim@example.com" });

  await requestEmailLink(portal, "rob@example.com", "198.51.100.9");
  await requestEmailLink(portal, "ana@example.com", "198.51.100.9");
  await requestEmailLink(portal, "kim@example.com", "198.51.100.9");

  assert.deepEqual(
    portal.mail.sent.map(({ to }) => to),
    ["rob@example.com", "ana@example.com"]
  );

  await requestEmailLink(portal, "kim@example.com", "198.51.100.10");

  assert.equal(portal.mail.sent.at(-1)?.to, "kim@example.com");
});

test("does stop sending to one address when it has had three links this hour, whatever the IP", async () => {
  const portal = portalWithRob({ ipLimit: 100 });

  for (let requestIndex = 0; requestIndex < EMAIL_LINKS_PER_ADDRESS_PER_HOUR + 2; requestIndex += 1) {
    await requestEmailLink(portal, ROB.email, `198.51.100.${requestIndex}`);
    portal.clock.now += 60_000;
  }

  assert.equal(portal.mail.sent.length, EMAIL_LINKS_PER_ADDRESS_PER_HOUR);

  portal.clock.now += 60 * 60 * 1000;
  await requestEmailLink(portal, ROB.email, "198.51.100.200");

  assert.equal(portal.mail.sent.length, EMAIL_LINKS_PER_ADDRESS_PER_HOUR + 1);
});

test("does store the requesting IP only as a hash when a link is emailed", async () => {
  const portal = portalWithRob();

  await requestEmailLink(portal, ROB.email, "203.0.113.77");

  const row = portal.db.raw.prepare("SELECT requested_ip_hash FROM email_tokens").get();

  assert.match(String(row?.requested_ip_hash), /^[0-9a-f]{64}$/);
});

test("does answer 400 when the email-link body is not an address", async () => {
  const portal = portalWithRob();

  assert.equal((await portal.request("POST", "/api/auth/email-link", { body: { email: "rob" } })).status, 400);
});

test("does log and swallow a failed send when the mail service is down", async () => {
  const portal = portalWithRob();

  portal.deps.mail = {
    send: async () => {
      throw new Error("down");
    }
  };

  const response = await requestEmailLink(portal, ROB.email);

  assert.equal(response.status, 202);
  assert.equal(portal.errors.length, 1);
});

test("does end the session and clear the cookie when a guest signs out", async () => {
  const portal = portalWithRob();
  const cookie = await portal.signInAs(ROB.guestId);
  const response = await portal.request("POST", "/api/auth/sign-out", { cookie });

  assert.equal(response.status, 204);
  assert.match(response.headers.get("Set-Cookie") ?? "", /^wn_session=; .*Max-Age=0/);
  assert.equal(countRows(portal, "sessions"), 0);
  assert.equal((await portal.request("GET", "/api/me", { cookie })).status, 401);
});

test("does build an emailed link on PUBLIC_ORIGIN when one is configured, whatever the request's host", async () => {
  const portal = portalWithRob({ publicOrigin: "https://canonical.example" });

  await requestEmailLink(portal, ROB.email);

  assert.match(portal.mail.sent[0]?.text ?? "", /https:\/\/canonical\.example\/s\/[A-Za-z0-9_-]{43}/);
  assert.ok(!(portal.mail.sent[0]?.text ?? "").includes("wingnight.tv"));
});

test("does send one address at most three links an hour when its requests arrive at once", async () => {
  const portal = portalWithRob({ ipLimit: 100 });

  await Promise.all(
    Array.from({ length: EMAIL_LINKS_PER_ADDRESS_PER_HOUR + 3 }, (_, requestIndex) =>
      portal.request("POST", "/api/auth/email-link", {
        body: { email: ROB.email },
        headers: { "CF-Connecting-IP": `198.51.100.${requestIndex}` }
      })
    )
  );
  await portal.settle();

  assert.equal(portal.mail.sent.length, EMAIL_LINKS_PER_ADDRESS_PER_HOUR);
});
