import assert from "node:assert/strict";
import test from "node:test";

import {
  AVATAR_HEAD_MAX_BYTES,
  AVATAR_PHOTO_UPLOAD_MAX_LENGTH,
  isAdminStyleReferenceRequest,
  readAvatarHeadPng,
  readAvatarPhotoUpload
} from "./index.js";

// A real 1×1 PNG: signature, IHDR, IDAT, IEND.
const ONE_PIXEL_PNG = Uint8Array.from(
  atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="),
  (character) => character.charCodeAt(0)
);
const JPEG_BASE64 = "/9j/4AAQSkZJRgABAQAAAQABAAD";

test("does read a canvas data URL when the photo upload is a JPEG, PNG or WebP", () => {
  assert.deepEqual(readAvatarPhotoUpload(`data:image/jpeg;base64,${JPEG_BASE64}A`), {
    mimeType: "image/jpeg",
    base64: `${JPEG_BASE64}A`
  });
  assert.equal(readAvatarPhotoUpload("data:image/png;base64,iVBORw0KGgoAAAAN")?.mimeType, "image/png");
  assert.equal(readAvatarPhotoUpload("data:image/webp;base64,UklGRhYAAABXRUJQ")?.mimeType, "image/webp");
});

test("does refuse a photo upload when its type, magic bytes or length do not add up", () => {
  assert.equal(readAvatarPhotoUpload(`data:image/gif;base64,${JPEG_BASE64}A`), null);
  assert.equal(readAvatarPhotoUpload(`data:image/png;base64,${JPEG_BASE64}A`), null, "JPEG bytes labelled PNG");
  assert.equal(readAvatarPhotoUpload(`data:image/jpeg;base64,${JPEG_BASE64}`), null, "not a multiple of four");
  assert.equal(readAvatarPhotoUpload(JPEG_BASE64), null, "no data URL prefix");
  assert.equal(readAvatarPhotoUpload("data:image/jpeg;base64,"), null);
  assert.equal(
    readAvatarPhotoUpload(`data:image/jpeg;base64,${JPEG_BASE64}${"A".repeat(AVATAR_PHOTO_UPLOAD_MAX_LENGTH)}`),
    null,
    "over the cap"
  );
});

test("does refuse a photo upload when its text could close the JSON string it is spliced into", () => {
  assert.equal(readAvatarPhotoUpload(`data:image/jpeg;base64,/9j/"}],"x":"`), null);
  assert.equal(readAvatarPhotoUpload(`data:image/jpeg;base64,/9j/\\u0022AA`), null);
});

test("does read a head's size when its bytes are a whole PNG", () => {
  assert.deepEqual(readAvatarHeadPng(ONE_PIXEL_PNG), { width: 1, height: 1 });
});

test("does refuse a head when it is not a whole PNG within the caps", () => {
  const truncated = ONE_PIXEL_PNG.slice(0, ONE_PIXEL_PNG.length - 1);
  const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, ...ONE_PIXEL_PNG.slice(3)]);
  const huge = ONE_PIXEL_PNG.slice();
  const oversized = new Uint8Array(AVATAR_HEAD_MAX_BYTES + 1);

  huge.set([0, 0, 0x10, 0], 16);
  oversized.set(ONE_PIXEL_PNG.subarray(0, 33));
  oversized.set(ONE_PIXEL_PNG.subarray(ONE_PIXEL_PNG.length - 12), oversized.length - 12);

  assert.equal(readAvatarHeadPng(truncated), null, "no IEND");
  assert.equal(readAvatarHeadPng(jpeg), null, "wrong signature");
  assert.equal(readAvatarHeadPng(huge), null, "4096 px wide");
  assert.equal(readAvatarHeadPng(oversized), null, "over the byte cap");
});

test("does accept a style-reference pick only when it names a guest", () => {
  assert.equal(isAdminStyleReferenceRequest({ guestId: "g_rob" }), true);
  assert.equal(isAdminStyleReferenceRequest({ guestId: "" }), false);
  assert.equal(isAdminStyleReferenceRequest({}), false);
  assert.equal(isAdminStyleReferenceRequest(null), false);
});
