import assert from "node:assert/strict";
import test from "node:test";

import { assemblePrompt, type GeminiImageRequest } from "@wingnight/avatar-head";
import {
  AVATAR_ATTEMPT_ID_HEADER,
  AVATAR_FAILED_TRIES_MAX,
  AVATAR_TRIES_LEFT_HEADER,
  AVATAR_TRIES_MAX,
  type AdminAvatarReset,
  type AdminGuestStatus,
  type PortalAvatarStatus,
  type PortalMe
} from "@wingnight/shared/guestPortal";

import { handleRequest } from "../app/index.ts";
import { STYLE_REFERENCE_KEY, resolveHeadKey, resolvePhotoKey } from "../avatarStore/index.ts";
import { FAKE_GENERATE_CONTENT_RESPONSE, FAKE_HEAD_PNG_BASE64 } from "../headPainter/fakeHead.ts";
import { createFakeHeadPainter, type HeadPainter } from "../headPainter/index.ts";
import { ADMIN_API_TOKEN, ORIGIN, createTestPortal, type TestPortal } from "../testing/harness/index.ts";

const PHOTO_BASE64 = `/9j/${"QUJD".repeat(500)}`;
const PHOTO_DATA_URL = `data:image/jpeg;base64,${PHOTO_BASE64}`;
const HEAD_PNG = Uint8Array.from(atob(FAKE_HEAD_PNG_BASE64), (character) => character.charCodeAt(0));
const BEARER = { Authorization: `Bearer ${ADMIN_API_TOKEN}` };

// A painter that keeps every request body it was handed, as text, and answers like the fake.
const createRecordingPainter = (): HeadPainter & { bodies: string[] } => {
  const bodies: string[] = [];

  return {
    bodies,
    paint: async ({ body }) => {
      bodies.push(await new Response(body).text());
      return new Response(FAKE_GENERATE_CONTENT_RESPONSE, { status: 200 });
    }
  };
};

const portalWithGuests = (options: { gemini?: HeadPainter } = {}): TestPortal => {
  const portal = createTestPortal(options);

  portal.addGuest({ guestId: "g_rob", displayName: "Rob", email: "rob@example.com" });
  portal.addGuest({ guestId: "g_ana", displayName: "Ana", email: "ana@example.com" });
  portal.addGuest({ guestId: "g_brad", displayName: "Brad", email: "brad@example.com", isAdmin: true });

  return portal;
};

const uploadPhoto = (portal: TestPortal, cookie: string, dataUrl = PHOTO_DATA_URL) =>
  portal.request("POST", "/api/me/avatar/photo", { cookie, rawBody: dataUrl, headers: { "Content-Type": "text/plain" } });

const generate = (portal: TestPortal, cookie: string) => portal.request("POST", "/api/me/avatar/generate", { cookie });

const accept = (portal: TestPortal, cookie: string, attemptId: string, png: Uint8Array<ArrayBuffer> = HEAD_PNG) =>
  portal.request("POST", `/api/me/avatar/accept?attemptId=${encodeURIComponent(attemptId)}`, {
    cookie,
    rawBody: png,
    headers: { "Content-Type": "image/png" }
  });

// Upload, paint and accept: the whole studio, for a guest who should end up with a head.
const makeHead = async (portal: TestPortal, cookie: string): Promise<void> => {
  assert.equal((await uploadPhoto(portal, cookie)).status, 200);

  const painted = await generate(portal, cookie);

  await painted.arrayBuffer();
  assert.equal((await accept(portal, cookie, painted.headers.get(AVATAR_ATTEMPT_ID_HEADER) ?? "")).status, 200);
};

const attemptRows = (portal: TestPortal, guestId: string) =>
  portal.db.raw
    .prepare("SELECT status, source_key, object_key, accepted_at FROM avatar_attempts WHERE guest_id = ? ORDER BY created_at")
    .all(guestId) as { status: string; source_key: string | null; object_key: string | null; accepted_at: number | null }[];

test("does answer 401 on every avatar route when there is no session", async () => {
  const portal = portalWithGuests();

  for (const [method, path] of [
    ["GET", "/api/me/avatar"],
    ["POST", "/api/me/avatar/photo"],
    ["POST", "/api/me/avatar/generate"],
    ["POST", "/api/me/avatar/accept?attemptId=a_x"]
  ] as const) {
    assert.equal((await portal.request(method, path)).status, 401, `${method} ${path}`);
  }
});

test("does keep the photo's base64 as it came, and its type, when a guest uploads a data URL", async () => {
  const portal = portalWithGuests();
  const cookie = await portal.signInAs("g_rob");
  const response = await uploadPhoto(portal, cookie);
  const status = (await response.json()) as PortalAvatarStatus;

  assert.equal(response.status, 200);
  assert.deepEqual(status, { triesMax: AVATAR_TRIES_MAX, triesLeft: AVATAR_TRIES_MAX, hasPhoto: true, headHash: null });
  assert.equal(portal.bucket.readText(resolvePhotoKey("g_rob")), PHOTO_BASE64);
  assert.deepEqual(await portal.bucket.head(resolvePhotoKey("g_rob")), {
    size: PHOTO_BASE64.length,
    customMetadata: { mimeType: "image/jpeg" }
  });
});

test("does refuse a photo when it is not a picture's data URL or is too big", async () => {
  const portal = portalWithGuests();
  const cookie = await portal.signInAs("g_rob");

  assert.equal((await uploadPhoto(portal, cookie, "data:text/html;base64,PGh0bWw+")).status, 400);
  assert.equal((await uploadPhoto(portal, cookie, `data:image/jpeg;base64,/9j/"}]`)).status, 400);

  const tooBig = await portal.request("POST", "/api/me/avatar/photo", {
    cookie,
    rawBody: PHOTO_DATA_URL,
    headers: { "Content-Length": "3000000" }
  });

  assert.equal(tooBig.status, 413);
  assert.deepEqual(portal.bucket.keys(), []);
});

test("does refuse to paint and spend nothing when no photo is uploaded", async () => {
  const painter = createRecordingPainter();
  const portal = portalWithGuests({ gemini: painter });
  const cookie = await portal.signInAs("g_rob");
  const response = await generate(portal, cookie);

  assert.equal(response.status, 409);
  assert.deepEqual(await response.json(), { error: "no_photo" });
  assert.equal(painter.bodies.length, 0);
  assert.equal(attemptRows(portal, "g_rob").length, 0);
});

test("does record the try as painting before Gemini is called", async () => {
  const seen: string[] = [];
  const portal = portalWithGuests({
    gemini: {
      paint: async (request) => {
        seen.push(...attemptRows(portal, "g_rob").map((row) => row.status));
        return createFakeHeadPainter().paint(request);
      }
    }
  });
  const cookie = await portal.signInAs("g_rob");

  await uploadPhoto(portal, cookie);
  await (await generate(portal, cookie)).arrayBuffer();

  assert.deepEqual(seen, ["painting"], "the row was there while Gemini painted");
  assert.deepEqual(attemptRows(portal, "g_rob").map((row) => row.status), ["painted"]);
});

test("does refuse the sixth try, without calling Gemini, when five are spent", async () => {
  const painter = createRecordingPainter();
  const portal = portalWithGuests({ gemini: painter });
  const cookie = await portal.signInAs("g_rob");

  await uploadPhoto(portal, cookie);

  for (let spent = 1; spent <= AVATAR_TRIES_MAX; spent += 1) {
    const response = await generate(portal, cookie);

    assert.equal(response.status, 200, `try ${spent}`);
    assert.equal(response.headers.get(AVATAR_TRIES_LEFT_HEADER), String(AVATAR_TRIES_MAX - spent));
    await response.arrayBuffer();
  }

  // The fifth try spent the last of them, so the photo went with it: nothing could paint it.
  assert.deepEqual(portal.bucket.keys(), [], "the photo is deleted once no try is left to paint it");

  const sixth = await generate(portal, cookie);

  assert.equal(sixth.status, 409);
  assert.deepEqual(await sixth.json(), { error: "no_photo" });
  assert.equal(painter.bodies.length, AVATAR_TRIES_MAX, "Gemini was called five times, not six");
  assert.equal((await uploadPhoto(portal, cookie)).status, 429, "a new photo would never be painted or deleted");
  assert.deepEqual(portal.bucket.keys(), []);
});

test("does hold the cap when a guest's presses all arrive at once", async () => {
  const painter = createRecordingPainter();
  const portal = portalWithGuests({ gemini: painter });
  const cookie = await portal.signInAs("g_rob");

  await uploadPhoto(portal, cookie);

  const responses = await Promise.all(Array.from({ length: AVATAR_TRIES_MAX + 3 }, () => generate(portal, cookie)));
  const statuses = responses.map((response) => response.status);

  // The extra presses are refused at the cap (429) or, once the last try has deleted the photo,
  // for want of one (409); none of them paints.
  assert.equal(statuses.filter((status) => status === 200).length, AVATAR_TRIES_MAX);
  assert.ok(statuses.every((status) => [200, 409, 429].includes(status)), statuses.join(","));
  assert.equal(painter.bodies.length, AVATAR_TRIES_MAX);
});

test("does give the try back when Gemini fails, until the failures reach their own cap", async () => {
  const portal = portalWithGuests({
    gemini: {
      paint: async ({ body }) => {
        await body.cancel();
        return new Response('{"error":{"code":503,"message":"overloaded"}}', { status: 503 });
      }
    }
  });
  const cookie = await portal.signInAs("g_rob");

  await uploadPhoto(portal, cookie);

  const failed = await generate(portal, cookie);

  assert.equal(failed.status, 502);
  assert.deepEqual(await failed.json(), { error: "painter_failed" });
  assert.equal(failed.headers.get(AVATAR_TRIES_LEFT_HEADER), String(AVATAR_TRIES_MAX));
  assert.match(portal.errors[0] ?? "", /503 .*overloaded/);

  for (let failure = 2; failure <= AVATAR_FAILED_TRIES_MAX; failure += 1) {
    assert.equal((await generate(portal, cookie)).status, 502);
  }

  // The last failure left no try, so it took the photo with it.
  assert.deepEqual(portal.bucket.keys(), []);
  assert.equal((await generate(portal, cookie)).status, 409);
  assert.equal((await uploadPhoto(portal, cookie)).status, 429);
});

test("does stream Gemini's reply through unread when it paints", async () => {
  const chunks = ['{"candidates":[{"content":{"parts":[{"inlineData":{"data":"', "iVBORw0KGgo", 'AAAA"}}]}}]}'];
  let upstream: ReadableStreamDefaultController<Uint8Array> | null = null;
  const portal = portalWithGuests({
    gemini: {
      paint: async ({ body }) => {
        await new Response(body).arrayBuffer();
        return new Response(
          new ReadableStream<Uint8Array>({
            start: (controller) => {
              upstream = controller;
              controller.enqueue(new TextEncoder().encode(chunks[0]));
            }
          }),
          { status: 200 }
        );
      }
    }
  });
  const cookie = await portal.signInAs("g_rob");

  await uploadPhoto(portal, cookie);

  // The response is in hand while Gemini's body is still open and is not yet JSON at all: the
  // Worker cannot have parsed it.
  const response = await generate(portal, cookie);

  assert.equal(response.status, 200);
  assert.match(response.headers.get(AVATAR_ATTEMPT_ID_HEADER) ?? "", /^a_/);

  const controller = upstream as ReadableStreamDefaultController<Uint8Array> | null;

  controller?.enqueue(new TextEncoder().encode(chunks[1]));
  controller?.enqueue(new TextEncoder().encode(chunks[2]));
  controller?.close();

  assert.equal(await response.text(), chunks.join(""), "byte for byte what Gemini sent");
});

test("does paint with the photo first and the style reference second once the admin has picked one", async () => {
  const painter = createRecordingPainter();
  const portal = portalWithGuests({ gemini: painter });
  const anaCookie = await portal.signInAs("g_ana");

  await makeHead(portal, anaCookie);
  assert.equal(
    (await portal.request("POST", "/api/admin/style-reference", { headers: BEARER, body: { guestId: "g_ana" } })).status,
    200
  );

  const robCookie = await portal.signInAs("g_rob");

  await uploadPhoto(portal, robCookie);
  await (await generate(portal, robCookie)).arrayBuffer();

  const [anaRequest, robRequest] = painter.bodies.map((body) => JSON.parse(body) as GeminiImageRequest);
  const parts = robRequest?.contents[0].parts ?? [];

  assert.equal(anaRequest?.contents[0].parts.length, 2, "Ana painted before any reference: prompt and photo");
  assert.deepEqual(parts, [
    { text: assemblePrompt({ hasStyleReference: true }) },
    { inlineData: { mimeType: "image/jpeg", data: PHOTO_BASE64 } },
    { inlineData: { mimeType: "image/png", data: FAKE_HEAD_PNG_BASE64 } }
  ]);
  assert.equal(portal.bucket.readText(STYLE_REFERENCE_KEY), FAKE_HEAD_PNG_BASE64);
});

test("does delete the face photo and keep only the head when a guest accepts", async () => {
  const portal = portalWithGuests();
  const cookie = await portal.signInAs("g_rob");

  await uploadPhoto(portal, cookie);

  for (let tries = 0; tries < 3; tries += 1) {
    await (await generate(portal, cookie)).arrayBuffer();
  }

  const painted = await generate(portal, cookie);
  const attemptId = painted.headers.get(AVATAR_ATTEMPT_ID_HEADER) ?? "";

  await painted.arrayBuffer();
  assert.deepEqual(portal.bucket.keys(), [resolvePhotoKey("g_rob")], "nothing but the photo before accepting");

  const response = await accept(portal, cookie, attemptId);
  const status = (await response.json()) as PortalAvatarStatus;

  assert.equal(response.status, 200);
  assert.deepEqual(portal.bucket.keys(), [resolveHeadKey("g_rob")], "the photo is gone; the head is all that is left");
  assert.equal(status.hasPhoto, false);
  assert.match(status.headHash ?? "", /^[0-9a-f]{64}$/);
  assert.equal(status.triesLeft, 1);
  assert.deepEqual(
    attemptRows(portal, "g_rob").map((row) => [row.source_key, row.accepted_at !== null]),
    [
      [null, false],
      [null, false],
      [null, false],
      [null, true]
    ],
    "no try still points at the deleted photo"
  );
});

test("does refuse a head when it is not a PNG, is too big, or names a try that is not the guest's", async () => {
  const portal = portalWithGuests();
  const robCookie = await portal.signInAs("g_rob");
  const anaCookie = await portal.signInAs("g_ana");

  await uploadPhoto(portal, robCookie);

  const painted = await generate(portal, robCookie);
  const attemptId = painted.headers.get(AVATAR_ATTEMPT_ID_HEADER) ?? "";

  await painted.arrayBuffer();

  const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, ...HEAD_PNG.slice(3)]);
  const asJpeg = await portal.request("POST", `/api/me/avatar/accept?attemptId=${attemptId}`, {
    cookie: robCookie,
    rawBody: HEAD_PNG,
    headers: { "Content-Type": "image/jpeg" }
  });
  const tooBig = await portal.request("POST", `/api/me/avatar/accept?attemptId=${attemptId}`, {
    cookie: robCookie,
    rawBody: HEAD_PNG,
    headers: { "Content-Type": "image/png", "Content-Length": "2000001" }
  });

  assert.equal(asJpeg.status, 415);
  assert.equal(tooBig.status, 413);
  assert.equal((await accept(portal, robCookie, attemptId, jpeg)).status, 400);
  assert.equal((await accept(portal, robCookie, attemptId, HEAD_PNG.slice(0, -1))).status, 400);
  assert.equal((await accept(portal, robCookie, "a_unknown")).status, 404);
  assert.equal((await accept(portal, anaCookie, attemptId)).status, 404, "Ana cannot accept Rob's try");
  assert.deepEqual(portal.bucket.keys(), [resolvePhotoKey("g_rob")], "nothing was stored and the photo stays");
});

test("does serve a head only to its owner and the admin", async () => {
  const portal = portalWithGuests();
  const robCookie = await portal.signInAs("g_rob");
  const anaCookie = await portal.signInAs("g_ana");
  const bradCookie = await portal.signInAs("g_brad");

  assert.equal((await portal.request("GET", "/api/me/avatar", { cookie: robCookie })).status, 404, "no head yet");

  await makeHead(portal, robCookie);

  const own = await portal.request("GET", "/api/me/avatar", { cookie: robCookie });

  assert.equal(own.status, 200);
  assert.equal(own.headers.get("Content-Type"), "image/png");
  assert.equal(own.headers.get("X-Content-Type-Options"), "nosniff");
  assert.deepEqual(new Uint8Array(await own.arrayBuffer()), HEAD_PNG);

  const anaReadsRob = await portal.request("GET", "/api/admin/guests/g_rob/avatar", { cookie: anaCookie });

  assert.equal(anaReadsRob.status, 403);
  assert.deepEqual(await anaReadsRob.json(), { error: "forbidden" });
  assert.equal((await portal.request("GET", "/api/me/avatar", { cookie: anaCookie })).status, 404, "Ana's own, not Rob's");

  const bradReadsRob = await portal.request("GET", "/api/admin/guests/g_rob/avatar", { cookie: bradCookie });

  assert.equal(bradReadsRob.status, 200);
  assert.deepEqual(new Uint8Array(await bradReadsRob.arrayBuffer()), HEAD_PNG);
  assert.equal((await portal.request("GET", "/api/admin/guests/g_rob/avatar", { headers: BEARER })).status, 200);
});

test("does replace the head and keep one accepted try when a guest accepts another", async () => {
  const portal = portalWithGuests();
  const cookie = await portal.signInAs("g_rob");

  await makeHead(portal, cookie);

  const firstHash = ((await (await portal.request("GET", "/api/me", { cookie })).json()) as PortalMe).avatar.headHash;
  const secondPng = HEAD_PNG.slice();

  // Still a whole PNG to the check, but a byte inside the IDAT differs, and so does the hash.
  secondPng[50] = (secondPng[50] ?? 0) ^ 1;

  await uploadPhoto(portal, cookie);

  const painted = await generate(portal, cookie);

  await painted.arrayBuffer();
  assert.equal((await accept(portal, cookie, painted.headers.get(AVATAR_ATTEMPT_ID_HEADER) ?? "", secondPng)).status, 200);

  const me = (await (await portal.request("GET", "/api/me", { cookie })).json()) as PortalMe;

  assert.notEqual(me.avatar.headHash, firstHash);
  assert.equal(me.hasHead, true);
  assert.deepEqual(
    attemptRows(portal, "g_rob").map((row) => row.accepted_at !== null),
    [false, true]
  );
  assert.deepEqual(portal.bucket.keys(), [resolveHeadKey("g_rob")]);
});

test("does refuse every avatar write when the request comes from another origin or none", async () => {
  const portal = portalWithGuests();
  const robCookie = await portal.signInAs("g_rob");
  const bradCookie = await portal.signInAs("g_brad");

  for (const origin of [null, "null", "https://evil.example"]) {
    const writes = [
      portal.request("POST", "/api/me/avatar/photo", {
        cookie: robCookie,
        origin,
        rawBody: PHOTO_DATA_URL,
        headers: { "Content-Type": "text/plain" }
      }),
      portal.request("POST", "/api/me/avatar/generate", { cookie: robCookie, origin }),
      portal.request("POST", "/api/me/avatar/accept?attemptId=a_x", {
        cookie: robCookie,
        origin,
        rawBody: HEAD_PNG,
        headers: { "Content-Type": "image/png" }
      }),
      portal.request("POST", "/api/admin/style-reference", { cookie: bradCookie, origin, body: { guestId: "g_rob" } })
    ];

    for (const response of await Promise.all(writes)) {
      assert.equal(response.status, 403, `origin ${String(origin)}`);
      assert.deepEqual(await response.json(), { error: "cross_origin" });
    }
  }

  assert.deepEqual(portal.bucket.keys(), []);
  assert.equal(attemptRows(portal, "g_rob").length, 0);
});

test("does mark a painted reply and a head as private and never stored when either is served", async () => {
  const portal = portalWithGuests();
  const cookie = await portal.signInAs("g_rob");

  await uploadPhoto(portal, cookie);

  const painted = await generate(portal, cookie);

  assert.equal(painted.headers.get("Cache-Control"), "private, no-store");
  await painted.arrayBuffer();
  await accept(portal, cookie, painted.headers.get(AVATAR_ATTEMPT_ID_HEADER) ?? "");

  const head = await portal.request("GET", "/api/me/avatar", { cookie });

  assert.equal(head.status, 200);
  assert.equal(head.headers.get("Cache-Control"), "private, no-store");
});

test("does refuse a photo upload when it declares no length", async () => {
  const portal = portalWithGuests();
  const cookie = await portal.signInAs("g_rob");
  const body = new ReadableStream<Uint8Array>({
    start: (controller) => {
      controller.enqueue(new TextEncoder().encode(PHOTO_DATA_URL));
      controller.close();
    }
  });
  const response = await handleRequest(
    new Request(`${ORIGIN}/api/me/avatar/photo`, {
      method: "POST",
      body,
      duplex: "half",
      headers: { Origin: ORIGIN, Cookie: cookie }
    } as RequestInit),
    portal.deps
  );

  assert.equal(response.status, 400);
  assert.deepEqual(portal.bucket.keys(), []);
});

// --- Review fixes: the photo never outlives its use, a try is kept once, a stale reference goes.

const readAdminGuest = async (portal: TestPortal, guestId: string): Promise<AdminGuestStatus | undefined> => {
  const guests = (await (await portal.request("GET", "/api/admin/guests", { headers: BEARER })).json()) as AdminGuestStatus[];

  return guests.find((guest) => guest.guestId === guestId);
};

test("does keep the photo while Gemini reads it and delete it once the last try is answered", async () => {
  const photoWhilePainting: boolean[] = [];
  const portal = portalWithGuests({
    gemini: {
      paint: async (request) => {
        photoWhilePainting.push(portal.bucket.keys().includes(resolvePhotoKey("g_rob")));
        return createFakeHeadPainter().paint(request);
      }
    }
  });
  const cookie = await portal.signInAs("g_rob");

  await uploadPhoto(portal, cookie);

  for (let spent = 1; spent < AVATAR_TRIES_MAX; spent += 1) {
    await (await generate(portal, cookie)).arrayBuffer();
    assert.deepEqual(portal.bucket.keys(), [resolvePhotoKey("g_rob")], `the photo stays while try ${spent + 1} is left`);
  }

  const last = await generate(portal, cookie);

  assert.equal(last.status, 200);
  assert.equal(last.headers.get(AVATAR_TRIES_LEFT_HEADER), "0");
  await last.arrayBuffer();
  assert.deepEqual(photoWhilePainting, Array(AVATAR_TRIES_MAX).fill(true), "every paint had the photo to read");
  assert.deepEqual(portal.bucket.keys(), [], "nothing left can paint it, so it is gone");
  assert.ok(attemptRows(portal, "g_rob").every((row) => row.source_key === null));
});

test("does refuse to keep a try a second time, and a try a newer head stood down", async () => {
  const portal = portalWithGuests();
  const cookie = await portal.signInAs("g_rob");
  const otherPng = HEAD_PNG.slice();

  otherPng[50] = (otherPng[50] ?? 0) ^ 1;
  await uploadPhoto(portal, cookie);

  const first = await generate(portal, cookie);
  const firstId = first.headers.get(AVATAR_ATTEMPT_ID_HEADER) ?? "";

  await first.arrayBuffer();
  assert.equal((await accept(portal, cookie, firstId)).status, 200);

  const again = await accept(portal, cookie, firstId, otherPng);

  assert.equal(again.status, 404);
  assert.deepEqual(await again.json(), { error: "not_found" });
  assert.deepEqual(new Uint8Array(await (await portal.request("GET", "/api/me/avatar", { cookie })).arrayBuffer()), HEAD_PNG);

  await uploadPhoto(portal, cookie);

  const second = await generate(portal, cookie);

  await second.arrayBuffer();
  assert.equal((await accept(portal, cookie, second.headers.get(AVATAR_ATTEMPT_ID_HEADER) ?? "", otherPng)).status, 200);
  assert.equal((await accept(portal, cookie, firstId)).status, 404, "the stood-down try cannot come back");
});

test("does delete the photo, and nothing else, when the guest removes it", async () => {
  const portal = portalWithGuests();
  const cookie = await portal.signInAs("g_rob");

  assert.equal((await portal.request("DELETE", "/api/me/avatar/photo")).status, 401);

  await makeHead(portal, cookie);
  await uploadPhoto(portal, cookie);
  assert.deepEqual(portal.bucket.keys(), [resolveHeadKey("g_rob"), resolvePhotoKey("g_rob")]);

  const crossSite = await portal.request("DELETE", "/api/me/avatar/photo", { cookie, origin: "https://evil.example" });

  assert.equal(crossSite.status, 403);

  const removed = await portal.request("DELETE", "/api/me/avatar/photo", { cookie });
  const status = (await removed.json()) as PortalAvatarStatus;

  assert.equal(removed.status, 200);
  assert.equal(status.hasPhoto, false);
  assert.match(status.headHash ?? "", /^[0-9a-f]{64}$/, "the kept head stays");
  assert.deepEqual(portal.bucket.keys(), [resolveHeadKey("g_rob")]);
});

test("does give a guest their tries back and clear their photo, keeping the head, when the admin resets them", async () => {
  const portal = portalWithGuests();
  const robCookie = await portal.signInAs("g_rob");
  const anaCookie = await portal.signInAs("g_ana");

  await makeHead(portal, robCookie);
  await uploadPhoto(portal, robCookie);
  await (await generate(portal, robCookie)).arrayBuffer();
  assert.equal((await readAdminGuest(portal, "g_rob"))?.triesLeft, AVATAR_TRIES_MAX - 2);

  const refused = await portal.request("POST", "/api/admin/guests/g_rob/avatar/reset", { cookie: anaCookie });

  assert.equal(refused.status, 403);
  assert.equal((await portal.request("POST", "/api/admin/guests/g_nobody/avatar/reset", { headers: BEARER })).status, 404);

  const response = await portal.request("POST", "/api/admin/guests/g_rob/avatar/reset", { headers: BEARER });
  const reset = (await response.json()) as AdminAvatarReset;

  assert.equal(response.status, 200);
  assert.equal(reset.guestId, "g_rob");
  assert.equal(reset.avatar.triesLeft, AVATAR_TRIES_MAX);
  assert.equal(reset.avatar.hasPhoto, false);
  assert.match(reset.avatar.headHash ?? "", /^[0-9a-f]{64}$/);
  assert.deepEqual(portal.bucket.keys(), [resolveHeadKey("g_rob")]);
  assert.equal((await readAdminGuest(portal, "g_rob"))?.triesLeft, AVATAR_TRIES_MAX);
  assert.equal((await portal.request("GET", "/api/me/avatar", { cookie: robCookie })).status, 200);

  await uploadPhoto(portal, robCookie);

  const painted = await generate(portal, robCookie);

  assert.equal(painted.status, 200);
  assert.equal(painted.headers.get(AVATAR_TRIES_LEFT_HEADER), String(AVATAR_TRIES_MAX - 1));
  await painted.arrayBuffer();
});

test("does drop the style reference when its guest keeps a different head", async () => {
  const painter = createRecordingPainter();
  const portal = portalWithGuests({ gemini: painter });
  const anaCookie = await portal.signInAs("g_ana");
  const robCookie = await portal.signInAs("g_rob");
  const newerPng = HEAD_PNG.slice();

  newerPng[50] = (newerPng[50] ?? 0) ^ 1;
  await makeHead(portal, anaCookie);
  await portal.request("POST", "/api/admin/style-reference", { headers: BEARER, body: { guestId: "g_ana" } });
  assert.equal((await readAdminGuest(portal, "g_ana"))?.isStyleReference, true);

  await uploadPhoto(portal, anaCookie);

  const repaint = await generate(portal, anaCookie);

  await repaint.arrayBuffer();
  assert.equal((await accept(portal, anaCookie, repaint.headers.get(AVATAR_ATTEMPT_ID_HEADER) ?? "", newerPng)).status, 200);

  assert.equal((await readAdminGuest(portal, "g_ana"))?.isStyleReference, false);
  assert.equal(portal.bucket.readText(STYLE_REFERENCE_KEY), null);
  assert.equal(portal.db.raw.prepare("SELECT COUNT(*) AS count FROM style_reference").get()?.count, 0);

  await uploadPhoto(portal, robCookie);
  await (await generate(portal, robCookie)).arrayBuffer();

  const robRequest = JSON.parse(painter.bodies.at(-1) ?? "{}") as GeminiImageRequest;

  assert.equal(robRequest.contents[0].parts.length, 2, "painted without the stale reference");
});

test("does give the try back and let go of the photo when painting throws before Gemini answers", async () => {
  const portal = portalWithGuests({
    gemini: {
      paint: async () => {
        throw new Error("network down");
      }
    }
  });
  const cookie = await portal.signInAs("g_rob");

  await uploadPhoto(portal, cookie);

  const response = await generate(portal, cookie);

  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), { error: "painter_failed" });
  assert.equal(response.headers.get(AVATAR_TRIES_LEFT_HEADER), String(AVATAR_TRIES_MAX));
  assert.deepEqual(attemptRows(portal, "g_rob").map((row) => row.status), ["failed"]);
  assert.equal(portal.bucket.openReads(), 0, "the photo's stream was cancelled, not left open");
});

test("does give the try back and cancel the photo's stream when the style reference cannot be read", async () => {
  const painter = createRecordingPainter();
  const portal = portalWithGuests({ gemini: painter });
  const cookie = await portal.signInAs("g_rob");
  const get = portal.bucket.get.bind(portal.bucket);

  await uploadPhoto(portal, cookie);
  portal.bucket.get = async (key) => {
    if (key === STYLE_REFERENCE_KEY) {
      throw new Error("R2 hiccup");
    }

    return get(key);
  };

  const response = await generate(portal, cookie);

  assert.equal(response.status, 502);
  assert.equal(response.headers.get(AVATAR_TRIES_LEFT_HEADER), String(AVATAR_TRIES_MAX));
  assert.equal(painter.bodies.length, 0, "Gemini was never called");
  assert.deepEqual(attemptRows(portal, "g_rob").map((row) => row.status), ["failed"]);
  assert.equal(portal.bucket.openReads(), 0);
});

test("does cancel the photo's stream when there is nothing to paint it with", async () => {
  const portal = portalWithGuests();
  const cookie = await portal.signInAs("g_rob");

  await portal.bucket.put(resolvePhotoKey("g_rob"), PHOTO_BASE64, { customMetadata: { mimeType: "image/gif" } });

  assert.equal((await generate(portal, cookie)).status, 409);
  assert.equal(portal.bucket.openReads(), 0);
});

test("does refuse a photo whose base64 carries control characters, before storing anything", async () => {
  const portal = portalWithGuests();
  const cookie = await portal.signInAs("g_rob");

  assert.equal((await uploadPhoto(portal, cookie, "data:image/jpeg;base64,/9j/AA\n\u0000AAAA")).status, 400);
  assert.deepEqual(portal.bucket.keys(), []);
});
