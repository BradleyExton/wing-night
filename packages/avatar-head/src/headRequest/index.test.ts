import assert from "node:assert/strict";
import test from "node:test";

import { fillGeminiImageRequestTemplate } from "../geminiRequest/index.ts";
import { assemblePrompt } from "../headPrompt/index.ts";
import { buildHeadRequest, buildHeadRequestTemplate } from "./index.ts";

const photo = { mimeType: "image/jpeg", base64: "PHOTO" };
const styleReference = { mimeType: "image/png", base64: "STYLE" };

test("does send the photo alone with the plain prompt when there is no style reference", () => {
  const request = buildHeadRequest({ photo, styleReference: null });

  assert.deepEqual(request.contents[0].parts, [
    { text: assemblePrompt({ hasStyleReference: false }) },
    { inlineData: { mimeType: "image/jpeg", data: "PHOTO" } }
  ]);
  assert.deepEqual(request.generationConfig, {
    responseModalities: ["IMAGE"],
    imageConfig: { aspectRatio: "1:1" }
  });
});

test("does send the photo then the style reference with the fenced prompt when a reference is given", () => {
  const request = buildHeadRequest({ photo, styleReference });

  assert.deepEqual(request.contents[0].parts, [
    { text: assemblePrompt({ hasStyleReference: true }) },
    { inlineData: { mimeType: "image/jpeg", data: "PHOTO" } },
    { inlineData: { mimeType: "image/png", data: "STYLE" } }
  ]);
});

test("does stream the same body as the built request with and without a style reference", () => {
  const withReference = buildHeadRequestTemplate({
    photoMimeType: "image/jpeg",
    styleReferenceMimeType: "image/png"
  });
  const withoutReference = buildHeadRequestTemplate({
    photoMimeType: "image/jpeg",
    styleReferenceMimeType: null
  });

  assert.equal(withReference.length, 3);
  assert.equal(
    fillGeminiImageRequestTemplate(withReference, ["PHOTO", "STYLE"]),
    JSON.stringify(buildHeadRequest({ photo, styleReference }))
  );
  assert.equal(withoutReference.length, 2);
  assert.equal(
    fillGeminiImageRequestTemplate(withoutReference, ["PHOTO"]),
    JSON.stringify(buildHeadRequest({ photo, styleReference: null }))
  );
});
