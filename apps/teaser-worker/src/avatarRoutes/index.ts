// A guest's avatar studio, server side: upload a photo, spend a try at painting it, accept the
// head, see it. The guest's browser does all the picture work (downscaling, keying, encoding);
// these handlers store, count and stream, because a free-plan Worker gets 10 ms of CPU a request
// and a head is megabytes of base64. The order of calls is documented on PORTAL_API_ROUTES.
import {
  AVATAR_ATTEMPT_ID_HEADER,
  AVATAR_ATTEMPT_ID_PARAM,
  AVATAR_HEAD_MAX_BYTES,
  AVATAR_HEAD_TYPE,
  AVATAR_PHOTO_TYPES,
  AVATAR_PHOTO_UPLOAD_MAX_LENGTH,
  AVATAR_TRIES_LEFT_HEADER,
  AVATAR_FAILED_TRIES_MAX,
  AVATAR_TRIES_MAX,
  PORTAL_API_ROUTES,
  readAvatarHeadPng,
  readAvatarPhotoUpload,
  type AvatarPhotoType
} from "@wingnight/shared/guestPortal";

import {
  STYLE_REFERENCE_KEY,
  deletePhoto,
  readAttemptCounts,
  readAvatarStatus,
  resolveHeadKey,
  resolvePhotoKey,
  resolveTriesLeft,
  serveHead
} from "../avatarStore/index.ts";
import type { BucketObject, PortalDeps } from "../deps/index.ts";
import type { HeadPaintRequest } from "../headPainter/index.ts";
import { composeHeadRequestBody, type StoredBase64Image } from "../headRequestBody/index.ts";
import { errorResponse, jsonResponse, readContentLength, readMediaType } from "../http/index.ts";
import type { GuestContext, PortalRoute } from "../routeContext/index.ts";
import { hashBytes, mintAttemptId } from "../tokens/index.ts";

const isAvatarPhotoType = (value: unknown): value is AvatarPhotoType => {
  return typeof value === "string" && (AVATAR_PHOTO_TYPES as readonly string[]).includes(value);
};

const toStoredImage = (object: BucketObject | null): StoredBase64Image | null => {
  const mimeType = object?.customMetadata?.mimeType;

  return object === null || mimeType === undefined
    ? null
    : { mimeType, body: object.body, byteLength: object.size };
};

const uploadPhoto = async ({ request, deps, session }: GuestContext): Promise<Response> => {
  const declaredLength = readContentLength(request);

  if (declaredLength === null) {
    return errorResponse("bad_request");
  }

  if (declaredLength > AVATAR_PHOTO_UPLOAD_MAX_LENGTH) {
    return errorResponse("too_large");
  }

  // A photo nobody can paint would only sit in R2: accepting a head is what deletes it.
  if (resolveTriesLeft(await readAttemptCounts(deps, session.guestId)) === 0) {
    return errorResponse("tries_exhausted");
  }

  const photo = readAvatarPhotoUpload(await request.text());

  if (photo === null) {
    return errorResponse("bad_request");
  }

  await deps.bucket.put(resolvePhotoKey(session.guestId), photo.base64, {
    httpMetadata: { contentType: "text/plain; charset=us-ascii" },
    customMetadata: { mimeType: photo.mimeType }
  });

  return jsonResponse(await readAvatarStatus(deps, session.guestId));
};

// Records the try BEFORE Gemini is called, in one statement that also checks the caps, so two
// presses at once cannot both squeeze under the cap and a Worker that dies mid-call still spent
// the try. True when it was recorded.
const recordAttempt = async (deps: PortalDeps, guestId: string, attemptId: string): Promise<boolean> => {
  const { meta } = await deps.db
    .prepare(
      `INSERT INTO avatar_attempts (attempt_id, guest_id, created_at, status, source_key)
       SELECT ?, ?, ?, 'painting', ?
       WHERE (SELECT COUNT(*) FROM avatar_attempts
              WHERE guest_id = ? AND reset_at IS NULL AND status IN ('painting', 'painted')) < ?
         AND (SELECT COUNT(*) FROM avatar_attempts
              WHERE guest_id = ? AND reset_at IS NULL AND status = 'failed') < ?`
    )
    .bind(
      attemptId,
      guestId,
      deps.now(),
      resolvePhotoKey(guestId),
      guestId,
      AVATAR_TRIES_MAX,
      guestId,
      AVATAR_FAILED_TRIES_MAX
    )
    .run();

  return meta.changes === 1;
};

const markAttempt = async (deps: PortalDeps, attemptId: string, status: "painted" | "failed"): Promise<void> => {
  await deps.db.prepare("UPDATE avatar_attempts SET status = ? WHERE attempt_id = ?").bind(status, attemptId).run();
};

// Answers with the tries the guest has left, and — when that is none — deletes the photo: nothing
// can ever paint it again, so it is not kept. Called only once Gemini has answered or failed, so
// the photo's stream has been read (or cancelled) before its object goes.
const settleTry = async (response: Response, deps: PortalDeps, guestId: string): Promise<Response> => {
  const triesLeft = resolveTriesLeft(await readAttemptCounts(deps, guestId));

  if (triesLeft === 0) {
    await deletePhoto(deps, guestId);
  }

  response.headers.set(AVATAR_TRIES_LEFT_HEADER, String(triesLeft));

  return response;
};

// Gemini's own words on a failure, for the log: its error bodies are a few hundred bytes of JSON.
const describeFailure = async (upstream: Response): Promise<string> => {
  const text = await upstream.text().catch(() => "");

  return `${upstream.status} ${text.slice(0, 500)}`;
};

// A stream given up on: cancelled if nobody took it, ignored if somebody did.
const release = async (stream: ReadableStream<Uint8Array> | null | undefined): Promise<void> => {
  if (stream !== null && stream !== undefined && !stream.locked) {
    await stream.cancel().catch(() => undefined);
  }
};

const generateHead = async ({ deps, session }: GuestContext): Promise<Response> => {
  const photo = toStoredImage(await deps.bucket.get(resolvePhotoKey(session.guestId)));

  if (photo === null || !isAvatarPhotoType(photo.mimeType)) {
    await release(photo?.body);
    return errorResponse("no_photo");
  }

  const attemptId = mintAttemptId(deps.random);

  if (!(await recordAttempt(deps, session.guestId, attemptId))) {
    await release(photo.body);
    return settleTry(errorResponse("tries_exhausted"), deps, session.guestId);
  }

  // From here the try is recorded. Anything that throws before Gemini's reply is on its way back
  // gives it back as failed, and lets go of every stream it was holding.
  let styleReference: StoredBase64Image | null = null;
  let request: HeadPaintRequest | null = null;
  let upstream: Response | null = null;

  try {
    styleReference = toStoredImage(await deps.bucket.get(STYLE_REFERENCE_KEY));
    request = composeHeadRequestBody({ photo, styleReference });
    upstream = await deps.gemini.paint(request);

    if (!upstream.ok || upstream.body === null) {
      await markAttempt(deps, attemptId, "failed");
      deps.logError(`avatar: painting ${attemptId} failed: ${await describeFailure(upstream)}`);

      return settleTry(errorResponse("painter_failed"), deps, session.guestId);
    }

    // "Painted" means Gemini answered; whether it drew a head or wrote a refusal, the browser's
    // extractor finds out, and either way the try is spent.
    await markAttempt(deps, attemptId, "painted");

    // Gemini's body, passed along unread.
    const response = new Response(upstream.body, {
      headers: { "Content-Type": "application/json; charset=utf-8", [AVATAR_ATTEMPT_ID_HEADER]: attemptId }
    });

    return await settleTry(response, deps, session.guestId);
  } catch (error) {
    deps.logError(`avatar: painting ${attemptId} threw`, error);
    await release(upstream?.body);

    if (request === null) {
      await release(photo.body);
      await release(styleReference?.body);
    } else {
      await release(request.body);
    }

    await markAttempt(deps, attemptId, "failed").catch((markError: unknown) =>
      deps.logError(`avatar: marking ${attemptId} failed threw`, markError)
    );

    return settleTry(errorResponse("painter_failed"), deps, session.guestId);
  }
};

const acceptHead = async ({ request, url, deps, session }: GuestContext): Promise<Response> => {
  const attemptId = url.searchParams.get(AVATAR_ATTEMPT_ID_PARAM) ?? "";
  const attempt = await deps.db
    // A try is kept once: a kept try has its head's hash for good (a later head stands it down
    // without clearing it), so the same attemptId cannot store a second picture.
    .prepare(
      `SELECT attempt_id FROM avatar_attempts
       WHERE attempt_id = ? AND guest_id = ? AND status = 'painted' AND accepted_at IS NULL AND head_hash IS NULL`
    )
    .bind(attemptId, session.guestId)
    .first<{ attempt_id: string }>();

  if (attempt === null) {
    return errorResponse("not_found");
  }

  if (readMediaType(request) !== AVATAR_HEAD_TYPE) {
    return errorResponse("unsupported_media_type");
  }

  const declaredLength = readContentLength(request);

  if (declaredLength === null) {
    return errorResponse("bad_request");
  }

  if (declaredLength > AVATAR_HEAD_MAX_BYTES) {
    return errorResponse("too_large");
  }

  const bytes = new Uint8Array(await request.arrayBuffer());

  if (bytes.byteLength > AVATAR_HEAD_MAX_BYTES) {
    return errorResponse("too_large");
  }

  if (readAvatarHeadPng(bytes) === null) {
    return errorResponse("bad_request");
  }

  const headKey = resolveHeadKey(session.guestId);
  const headHash = await hashBytes(bytes);
  // A style reference copied from this guest's old head no longer is their head: it goes.
  const staleReference = await deps.db
    .prepare("SELECT 1 AS stale FROM style_reference WHERE guest_id = ? AND head_hash != ?")
    .bind(session.guestId, headHash)
    .first<{ stale: number }>();

  await deps.bucket.put(headKey, bytes, { httpMetadata: { contentType: AVATAR_HEAD_TYPE } });
  // One accepted try per guest (a partial unique index holds it), so a re-accept first stands the
  // old one down — its hash stays, the record that it was once kept. Every try's photo is gone
  // once this returns, so none still points at it.
  await deps.db.batch([
    deps.db
      .prepare(
        `UPDATE avatar_attempts SET accepted_at = NULL, object_key = NULL
         WHERE guest_id = ? AND accepted_at IS NOT NULL AND attempt_id != ?`
      )
      .bind(session.guestId, attemptId),
    deps.db
      .prepare("UPDATE avatar_attempts SET accepted_at = ?, object_key = ?, head_hash = ? WHERE attempt_id = ?")
      .bind(deps.now(), headKey, headHash, attemptId),
    ...(staleReference === null
      ? []
      : [deps.db.prepare("DELETE FROM style_reference WHERE guest_id = ?").bind(session.guestId)])
  ]);

  if (staleReference !== null) {
    await deps.bucket.delete(STYLE_REFERENCE_KEY);
  }

  // The face photo is only ever kept until there is a head. Painted tries were never stored.
  await deletePhoto(deps, session.guestId);

  return jsonResponse(await readAvatarStatus(deps, session.guestId));
};

// The guest takes their photo back without painting it (or after giving up on it).
const removePhoto = async ({ deps, session }: GuestContext): Promise<Response> => {
  await deletePhoto(deps, session.guestId);

  return jsonResponse(await readAvatarStatus(deps, session.guestId));
};

const readOwnHead = async ({ deps, session }: GuestContext): Promise<Response> => {
  return serveHead(deps, session.guestId);
};

export const AVATAR_ROUTES: PortalRoute[] = [
  { method: "GET", pattern: PORTAL_API_ROUTES.myAvatar, access: "guest", handle: readOwnHead },
  { method: "POST", pattern: PORTAL_API_ROUTES.myAvatarPhoto, access: "guest", handle: uploadPhoto },
  { method: "DELETE", pattern: PORTAL_API_ROUTES.myAvatarPhoto, access: "guest", handle: removePhoto },
  { method: "POST", pattern: PORTAL_API_ROUTES.myAvatarGenerate, access: "guest", handle: generateHead },
  { method: "POST", pattern: PORTAL_API_ROUTES.myAvatarAccept, access: "guest", handle: acceptHead }
];
