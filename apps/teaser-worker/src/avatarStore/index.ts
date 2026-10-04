// Where a guest's avatar lives and how far along it is. The photo, the accepted head and the
// style reference are R2 objects; the tries are rows of `avatar_attempts`. A painted try is never
// stored — it streams through the Worker to the guest's phone — so the only face photo R2 ever
// holds is the uploaded one, and accepting a head deletes it.
import {
  AVATAR_FAILED_TRIES_MAX,
  AVATAR_HEAD_TYPE,
  AVATAR_TRIES_MAX,
  type PortalAvatarStatus
} from "@wingnight/shared/guestPortal";

import type { PortalDeps } from "../deps/index.ts";
import { errorResponse } from "../http/index.ts";

// The uploaded photo, as the base64 text of its data URL; `mimeType` in its custom metadata.
export const resolvePhotoKey = (guestId: string): string => `avatars/${guestId}/photo.b64`;
// The accepted head, as PNG bytes.
export const resolveHeadKey = (guestId: string): string => `avatars/${guestId}/head.png`;
// The style reference, as base64 text ready to splice into a Gemini request.
export const STYLE_REFERENCE_KEY = "style-reference/head.b64";

export type AttemptCounts = {
  // Tries that count: recorded and painted, or recorded and never heard back from.
  spent: number;
  // Calls Gemini plainly failed, which give the try back (AVATAR_FAILED_TRIES_MAX).
  failed: number;
  headHash: string | null;
};

export const readAttemptCounts = async (deps: PortalDeps, guestId: string): Promise<AttemptCounts> => {
  const row = await deps.db
    .prepare(
      `SELECT
         COALESCE(SUM(status IN ('painting', 'painted')), 0) AS spent,
         COALESCE(SUM(status = 'failed'), 0) AS failed,
         MAX(CASE WHEN accepted_at IS NOT NULL THEN head_hash END) AS head_hash
       FROM avatar_attempts WHERE guest_id = ?`
    )
    .bind(guestId)
    .first<{ spent: number; failed: number; head_hash: string | null }>();

  return { spent: row?.spent ?? 0, failed: row?.failed ?? 0, headHash: row?.head_hash ?? null };
};

export const resolveTriesLeft = ({ spent, failed }: AttemptCounts): number => {
  return failed >= AVATAR_FAILED_TRIES_MAX ? 0 : Math.max(0, AVATAR_TRIES_MAX - spent);
};

export const readAvatarStatus = async (deps: PortalDeps, guestId: string): Promise<PortalAvatarStatus> => {
  const [counts, photo] = await Promise.all([
    readAttemptCounts(deps, guestId),
    deps.bucket.head(resolvePhotoKey(guestId))
  ]);

  return {
    triesMax: AVATAR_TRIES_MAX,
    triesLeft: resolveTriesLeft(counts),
    hasPhoto: photo !== null,
    headHash: counts.headHash
  };
};

export type AcceptedHead = {
  objectKey: string;
  headHash: string;
};

export const readAcceptedHead = async (deps: PortalDeps, guestId: string): Promise<AcceptedHead | null> => {
  const row = await deps.db
    .prepare(
      `SELECT object_key, head_hash FROM avatar_attempts
       WHERE guest_id = ? AND accepted_at IS NOT NULL AND object_key IS NOT NULL AND head_hash IS NOT NULL`
    )
    .bind(guestId)
    .first<{ object_key: string; head_hash: string }>();

  return row === null ? null : { objectKey: row.object_key, headHash: row.head_hash };
};

// A guest's head as the image, streamed from R2. Whoever may see it has been decided already.
export const serveHead = async (deps: PortalDeps, guestId: string): Promise<Response> => {
  const head = await readAcceptedHead(deps, guestId);
  const object = head === null ? null : await deps.bucket.get(head.objectKey);

  if (head === null || object === null) {
    return errorResponse("not_found");
  }

  return new Response(object.body, {
    headers: {
      "Content-Type": AVATAR_HEAD_TYPE,
      ETag: `"${head.headHash}"`,
      // A guest uploaded these bytes; checked as a PNG, and never to be sniffed as anything else.
      "X-Content-Type-Options": "nosniff"
    }
  });
};
