import assert from "node:assert/strict";
import test from "node:test";

import {
  buildGeminiImageRequest,
  buildGeminiImageRequestTemplate,
  buildGeminiImageUrl,
  fillGeminiImageRequestTemplate,
  mimeTypeForImageFile
} from "./index.ts";

test("does attach every image after the prompt in order when building a request", () => {
  const request = buildGeminiImageRequest({
    prompt: "p",
    images: [
      { mimeType: "image/jpeg", base64: "AAA" },
      { mimeType: "image/png", base64: "BBB" }
    ],
    aspectRatio: "1:1"
  });

  assert.deepEqual(request, {
    contents: [
      {
        parts: [
          { text: "p" },
          { inlineData: { mimeType: "image/jpeg", data: "AAA" } },
          { inlineData: { mimeType: "image/png", data: "BBB" } }
        ]
      }
    ],
    generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "1:1" } }
  });
});

test("does leave imageConfig out when no aspect ratio is given", () => {
  const request = buildGeminiImageRequest({ prompt: "p", images: [{ mimeType: "image/jpeg", base64: "A" }] });

  assert.deepEqual(request.generationConfig, { responseModalities: ["IMAGE"] });
  assert.equal("imageConfig" in request.generationConfig, false);
});

test("does cut the serialised request open at each image when building a template", () => {
  const prompt = 'Quote " backslash \\ newline \n unicode é';
  const images = [
    { mimeType: "image/jpeg", base64: "/9j/4AAQSkZJRg==" },
    { mimeType: "image/png", base64: "iVBORw0KGgo+" }
  ];

  const segments = buildGeminiImageRequestTemplate({
    prompt,
    imageMimeTypes: images.map((image) => image.mimeType),
    aspectRatio: "1:1"
  });

  assert.equal(segments.length, 3);
  assert.equal(
    fillGeminiImageRequestTemplate(segments, images.map((image) => image.base64)),
    JSON.stringify(buildGeminiImageRequest({ prompt, images, aspectRatio: "1:1" }))
  );
});

test("does match the plain serialisation when a template has no images and no aspect ratio", () => {
  const segments = buildGeminiImageRequestTemplate({ prompt: "text only", imageMimeTypes: [] });

  assert.deepEqual(segments, [JSON.stringify(buildGeminiImageRequest({ prompt: "text only", images: [] }))]);
});

test("does refuse to fill a template when the image count does not match", () => {
  const segments = buildGeminiImageRequestTemplate({ prompt: "p", imageMimeTypes: ["image/png"] });

  assert.throws(() => fillGeminiImageRequestTemplate(segments, []), /takes 1 images, not 0/);
});

test("does map file names to mime types and address the model's generateContent", () => {
  assert.equal(mimeTypeForImageFile("cottage.JPG"), "image/jpeg");
  assert.equal(mimeTypeForImageFile("head.png"), "image/png");
  assert.equal(mimeTypeForImageFile("me.heic"), "image/heic");
  assert.equal(mimeTypeForImageFile("notes.txt"), null);
  assert.equal(
    buildGeminiImageUrl("m"),
    "https://generativelanguage.googleapis.com/v1beta/models/m:generateContent"
  );
});
