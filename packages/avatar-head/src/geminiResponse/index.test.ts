import assert from "node:assert/strict";
import test from "node:test";

import { extractGeneratedImage } from "./index.ts";

test("does extract the first image part when the reply mixes text and an image", () => {
  const image = extractGeneratedImage({
    candidates: [
      { content: { parts: [{ text: "here" }, { inlineData: { mimeType: "image/png", data: "CCC" } }] } }
    ]
  });

  assert.deepEqual(image, { mimeType: "image/png", base64: "CCC" });
});

test("does throw with the finish reason and the model's text when a reply is text only", () => {
  assert.throws(
    () =>
      extractGeneratedImage({
        candidates: [{ finishReason: "SAFETY", content: { parts: [{ text: "no" }, { text: "thanks" }] } }]
      }),
    /^Error: No image in response \(finishReason: SAFETY\): no thanks$/
  );
});

test("does throw an unknown finish reason when the reply is not a generateContent body", () => {
  assert.throws(() => extractGeneratedImage(null), /finishReason: unknown\)$/);
  assert.throws(() => extractGeneratedImage({ candidates: "nope" }), /finishReason: unknown\)$/);
  assert.throws(
    () => extractGeneratedImage({ candidates: [{ content: { parts: [{ inlineData: { data: "" } }] } }] }),
    /No image in response/
  );
});

test("does default the mime type to png when the image part carries none", () => {
  assert.deepEqual(
    extractGeneratedImage({ candidates: [{ content: { parts: [{ inlineData: { data: "DDD" } }] } }] }),
    { mimeType: "image/png", base64: "DDD" }
  );
});
