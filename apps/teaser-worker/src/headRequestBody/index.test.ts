import assert from "node:assert/strict";
import test from "node:test";

import { buildHeadRequest } from "@wingnight/avatar-head";

import { composeHeadRequestBody, type StoredBase64Image } from "./index.ts";

const PHOTO_BASE64 = `/9j/${"QUJD".repeat(500)}`;
const STYLE_BASE64 = `iVBORw0KGgo${"A".repeat(401)}`;

// A stored image as R2 hands it over: its text in several chunks, and whether it was cancelled.
const stored = (mimeType: string, base64: string): StoredBase64Image & { cancelled: () => boolean } => {
  const bytes = new TextEncoder().encode(base64);
  let offset = 0;
  let cancelled = false;

  return {
    mimeType,
    byteLength: bytes.byteLength,
    cancelled: () => cancelled,
    body: new ReadableStream<Uint8Array>({
      pull: (controller) => {
        if (offset >= bytes.length) {
          controller.close();
          return;
        }

        controller.enqueue(bytes.slice(offset, offset + 300));
        offset += 300;
      },
      cancel: () => {
        cancelled = true;
      }
    })
  };
};

test("does stream exactly the shared head request when there is no style reference", async () => {
  const { body, byteLength } = composeHeadRequestBody({ photo: stored("image/jpeg", PHOTO_BASE64), styleReference: null });
  const text = await new Response(body).text();

  assert.equal(
    text,
    JSON.stringify(buildHeadRequest({ photo: { mimeType: "image/jpeg", base64: PHOTO_BASE64 }, styleReference: null }))
  );
  assert.equal(byteLength, new TextEncoder().encode(text).byteLength);
});

test("does stream the style reference after the photo when one is picked", async () => {
  const { body, byteLength } = composeHeadRequestBody({
    photo: stored("image/webp", PHOTO_BASE64),
    styleReference: stored("image/png", STYLE_BASE64)
  });
  const text = await new Response(body).text();

  assert.equal(
    text,
    JSON.stringify(
      buildHeadRequest({
        photo: { mimeType: "image/webp", base64: PHOTO_BASE64 },
        styleReference: { mimeType: "image/png", base64: STYLE_BASE64 }
      })
    )
  );
  assert.equal(byteLength, new TextEncoder().encode(text).byteLength);
});

test("does release both stored images when the request body is abandoned before they are read", async () => {
  const photo = stored("image/jpeg", PHOTO_BASE64);
  const styleReference = stored("image/png", STYLE_BASE64);
  const reader = composeHeadRequestBody({ photo, styleReference }).body.getReader();

  await reader.read();
  await reader.cancel("gone");

  assert.equal(photo.cancelled(), true);
  assert.equal(styleReference.cancelled(), true);
});
