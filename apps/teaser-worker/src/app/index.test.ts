import assert from "node:assert/strict";
import test from "node:test";

import { PORTAL_RESPONSE_HEADERS } from "../http/index.ts";
import { mintPersonalLink } from "../signInLinks/index.ts";
import { ADMIN_API_TOKEN, createTestPortal, type TestPortal } from "../testing/harness/index.ts";

const assertPortalHeaders = (response: Response, label: string): void => {
  for (const [name, value] of Object.entries(PORTAL_RESPONSE_HEADERS)) {
    assert.equal(response.headers.get(name), value, `${label}: ${name}`);
  }

  assert.match(response.headers.get("X-Robots-Tag") ?? "", /noindex/, label);
};

const portalWithGuests = (): TestPortal => {
  const portal = createTestPortal();

  portal.addGuest({ guestId: "g_rob", displayName: "Rob", email: "rob@example.com" });
  portal.addGuest({ guestId: "g_brad", displayName: "Brad", email: "brad@example.com", isAdmin: true });

  return portal;
};

test("does put the robots, cache and referrer headers on a response when any route or failure makes it", async () => {
  const portal = portalWithGuests();
  const robCookie = await portal.signInAs("g_rob");
  const token = await mintPersonalLink(portal.deps, "g_rob");
  const responses: [string, Response][] = [
    ["sign-in page", await portal.request("GET", `/s/${token}`)],
    ["sign-in redirect", await portal.request("POST", `/s/${token}`)],
    ["dead link page", await portal.request("POST", "/s/AAAAAAAAAAAAAAAAAAAAAAAA")],
    ["malformed link page", await portal.request("GET", "/s/x")],
    ["guest JSON", await portal.request("GET", "/api/me", { cookie: robCookie })],
    ["401", await portal.request("GET", "/api/me")],
    ["403", await portal.request("GET", "/api/admin/guests", { cookie: robCookie })],
    ["cross-origin", await portal.request("POST", "/api/auth/sign-out", { origin: "https://evil.example" })],
    ["202", await portal.request("POST", "/api/auth/email-link", { body: { email: "rob@example.com" } })],
    ["204", await portal.request("POST", "/api/auth/sign-out", { cookie: robCookie })],
    ["404", await portal.request("GET", "/api/nope")],
    ["405", await portal.request("DELETE", "/api/me")],
    ["static fallthrough", await portal.request("GET", "/dunlop-dash")],
    ["bearer admin", await portal.request("GET", "/api/admin/votes", { headers: { Authorization: `Bearer ${ADMIN_API_TOKEN}` } })]
  ];

  portal.deps.db = {
    prepare: () => {
      throw new Error("database gone");
    },
    batch: async () => []
  };
  responses.push(["500", await portal.request("GET", "/api/me", { cookie: robCookie })]);

  for (const [label, response] of responses) {
    assertPortalHeaders(response, label);
  }

  assert.equal(responses.at(-1)?.[1].status, 500);
  assert.equal(responses.find(([label]) => label === "static fallthrough")?.[1].status, 200);
});

test("does refuse a state-changing API request when it comes from another origin or none", async () => {
  const portal = portalWithGuests();
  const cookie = await portal.signInAs("g_rob");
  const attempts: [string, string, unknown][] = [
    ["POST", "/api/auth/email-link", { email: "rob@example.com" }],
    ["POST", "/api/auth/sign-out", undefined],
    ["PUT", "/api/me/vote", { genreRanking: ["pop"], teammateWishes: [], teamFormat: "random_draw" }],
    ["POST", "/api/admin/guests", { displayName: "Mallory", email: null }]
  ];

  for (const origin of ["https://evil.example", "http://wingnight.tv", null]) {
    for (const [method, path, body] of attempts) {
      const response = await portal.request(method, path, { cookie, body, origin });

      assert.equal(response.status, 403, `${origin} ${method} ${path}`);
      assert.deepEqual(await response.json(), { error: "cross_origin" });
    }
  }

  await portal.settle();
  assert.equal(portal.mail.sent.length, 0);
  assert.equal(portal.db.raw.prepare("SELECT COUNT(*) AS n FROM sessions").get()?.n, 1);
  assert.equal(portal.db.raw.prepare("SELECT COUNT(*) AS n FROM votes").get()?.n, 0);
});

test("does refuse the sign-in POST when another site sends it", async () => {
  const portal = portalWithGuests();
  const token = await mintPersonalLink(portal.deps, "g_rob");
  const forged = await portal.request("POST", `/s/${token}`, { origin: "https://evil.example" });

  assert.equal(forged.status, 403);
  assert.equal(forged.headers.get("Set-Cookie"), null);
  assert.equal((await portal.request("POST", `/s/${token}`, { origin: null })).status, 303);
});

test("does let a read through when it comes from another origin", async () => {
  const portal = portalWithGuests();
  const cookie = await portal.signInAs("g_rob");

  assert.equal((await portal.request("GET", "/api/me", { cookie, origin: "https://evil.example" })).status, 200);
});

test("does forbid framing when the sign-in page is served", async () => {
  const portal = portalWithGuests();
  const page = await portal.request("GET", `/s/${await mintPersonalLink(portal.deps, "g_rob")}`);

  assert.equal(page.headers.get("Content-Security-Policy"), "frame-ancestors 'none'");
});

// What Chromium sends when the sign-in page's own button is pressed: the page is served with
// Referrer-Policy: no-referrer, and for a no-cors POST under that policy the Fetch spec
// serializes Origin as "null". Sec-Fetch-Site still tells the two apart.
test("does sign a guest in when the sign-in page's own form posts with Origin null", async () => {
  const portal = portalWithGuests();
  const token = await mintPersonalLink(portal.deps, "g_rob");
  const response = await portal.request("POST", `/s/${token}`, {
    origin: "null",
    headers: { "Sec-Fetch-Site": "same-origin", "Sec-Fetch-Mode": "navigate" }
  });

  assert.equal(response.status, 303);
});

test("does refuse the sign-in POST when another site posts it with Origin null", async () => {
  const portal = portalWithGuests();
  const token = await mintPersonalLink(portal.deps, "g_rob");
  const response = await portal.request("POST", `/s/${token}`, {
    origin: "null",
    headers: { "Sec-Fetch-Site": "cross-site", "Sec-Fetch-Mode": "navigate" }
  });

  assert.equal(response.status, 403);
  assert.equal(response.headers.get("Set-Cookie"), null);
});

test("does refuse the sign-in POST when the browser marks it cross-site or same-site, whatever its Origin", async () => {
  const portal = portalWithGuests();
  const token = await mintPersonalLink(portal.deps, "g_rob");

  for (const fetchSite of ["cross-site", "same-site", "none"]) {
    for (const origin of ["https://wingnight.tv", "null", null]) {
      const response = await portal.request("POST", `/s/${token}`, {
        origin,
        headers: { "Sec-Fetch-Site": fetchSite }
      });

      assert.equal(response.status, 403, `${fetchSite} ${origin}`);
    }
  }

  assert.equal(portal.db.raw.prepare("SELECT COUNT(*) AS n FROM sessions").get()?.n, 0);
});

test("does refuse the sign-in POST when it names a foreign Origin, even marked same-origin", async () => {
  const portal = portalWithGuests();
  const token = await mintPersonalLink(portal.deps, "g_rob");
  const response = await portal.request("POST", `/s/${token}`, {
    origin: "https://evil.example",
    headers: { "Sec-Fetch-Site": "same-origin" }
  });

  assert.equal(response.status, 403);
});

test("does refuse an API POST when its Origin is null", async () => {
  const portal = portalWithGuests();
  const response = await portal.request("POST", "/api/auth/email-link", {
    origin: "null",
    body: { email: "rob@example.com" }
  });

  assert.equal(response.status, 403);
});
