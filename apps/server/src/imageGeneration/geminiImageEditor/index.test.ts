import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  buildGeminiImageRequest,
  createGeminiImageEditor,
  extractGeneratedImage,
  extensionForMimeType,
  mimeTypeForImageFile,
  resolveGeminiApiKey
} from "./index.js";

test("builds an edit request with the source picture inline and no aspect override", () => {
  const request = buildGeminiImageRequest({
    prompt: "make it snow",
    sourceImage: { mimeType: "image/jpeg", base64: "abc" },
    aspectRatio: "1:1"
  });

  assert.deepEqual(request, {
    contents: [
      {
        parts: [
          { text: "make it snow" },
          { inlineData: { mimeType: "image/jpeg", data: "abc" } }
        ]
      }
    ],
    generationConfig: { responseModalities: ["IMAGE"] }
  });
});

test("builds a text-only request that honours the aspect ratio", () => {
  const request = buildGeminiImageRequest({
    prompt: "a dinosaur on a beach",
    sourceImage: null,
    aspectRatio: "16:9"
  });

  assert.deepEqual(request.generationConfig, {
    responseModalities: ["IMAGE"],
    imageConfig: { aspectRatio: "16:9" }
  });
});

test("does attach the references after the source and drop the aspect override when an edit carries a style reference", () => {
  const request = buildGeminiImageRequest({
    prompt: "match the second picture's hand",
    sourceImage: { mimeType: "image/jpeg", base64: "photo" },
    referenceImages: [{ mimeType: "image/png", base64: "style" }],
    aspectRatio: "1:1"
  });

  assert.deepEqual(request, {
    contents: [
      {
        parts: [
          { text: "match the second picture's hand" },
          { inlineData: { mimeType: "image/jpeg", data: "photo" } },
          { inlineData: { mimeType: "image/png", data: "style" } }
        ]
      }
    ],
    generationConfig: { responseModalities: ["IMAGE"] }
  });
});

test("does honour the aspect ratio when a fresh image is painted from references alone", () => {
  const request = buildGeminiImageRequest({
    prompt: "in this style",
    sourceImage: null,
    referenceImages: [{ mimeType: "image/png", base64: "style" }],
    aspectRatio: "16:9"
  });

  assert.deepEqual(request.contents[0].parts, [
    { text: "in this style" },
    { inlineData: { mimeType: "image/png", data: "style" } }
  ]);
  assert.deepEqual(request.generationConfig, {
    responseModalities: ["IMAGE"],
    imageConfig: { aspectRatio: "16:9" }
  });
});

test("extracts the first image part and reports a refusal with the model's text", () => {
  assert.deepEqual(
    extractGeneratedImage({
      candidates: [
        {
          content: {
            parts: [{ text: "here" }, { inlineData: { mimeType: "image/png", data: "zzz" } }]
          }
        }
      ]
    }),
    { mimeType: "image/png", base64: "zzz" }
  );

  assert.throws(
    () =>
      extractGeneratedImage({
        candidates: [{ finishReason: "SAFETY", content: { parts: [{ text: "no thanks" }] } }]
      }),
    /finishReason: SAFETY\): no thanks/
  );
  assert.throws(() => extractGeneratedImage(null), /finishReason: unknown/);
});

test("maps file names to mime types and mime types back to extensions", () => {
  assert.equal(mimeTypeForImageFile("cottage.JPG"), "image/jpeg");
  assert.equal(mimeTypeForImageFile("head.png"), "image/png");
  assert.equal(mimeTypeForImageFile("notes.txt"), null);
  assert.equal(extensionForMimeType("image/jpeg"), "jpg");
  assert.equal(extensionForMimeType("image/png"), "png");
  assert.equal(extensionForMimeType("application/octet-stream"), "png");
});

test("resolves the key from the environment before the pack's .env", () => {
  const packDir = mkdtempSync(join(tmpdir(), "wn-pack-"));
  writeFileSync(join(packDir, ".env"), "# key\nexport GEMINI_API_KEY=\"from-file\"\n");

  assert.equal(resolveGeminiApiKey({ contentRootDir: packDir, env: {} }), "from-file");
  assert.equal(
    resolveGeminiApiKey({ contentRootDir: packDir, env: { GEMINI_API_KEY: " from-env " } }),
    "from-env"
  );

  const emptyDir = mkdtempSync(join(tmpdir(), "wn-empty-"));
  assert.equal(resolveGeminiApiKey({ contentRootDir: emptyDir, env: {} }), null);
});

test("posts the request with the key header and surfaces an HTTP failure", async () => {
  const calls: { url: string; init: RequestInit }[] = [];
  const editor = createGeminiImageEditor({
    apiKey: "secret",
    model: "test-model",
    fetchImpl: (async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init: init ?? {} });
      return new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ inlineData: { mimeType: "image/png", data: "ok" } }] } }]
        }),
        { status: 200 }
      );
    }) as typeof fetch
  });

  const image = await editor.generate({ prompt: "paint", sourceImage: null });

  assert.deepEqual(image, { mimeType: "image/png", base64: "ok" });
  assert.equal(calls[0]?.url, "https://generativelanguage.googleapis.com/v1beta/models/test-model:generateContent");
  assert.equal(
    (calls[0]?.init.headers as Record<string, string>)["x-goog-api-key"],
    "secret"
  );

  const failing = createGeminiImageEditor({
    apiKey: "secret",
    fetchImpl: (async () => new Response("quota", { status: 429 })) as typeof fetch
  });
  await assert.rejects(failing.generate({ prompt: "paint", sourceImage: null }), /Gemini 429: quota/);
});

test("does post every attached picture in order when an edit carries a style reference", async () => {
  const bodies: unknown[] = [];
  const editor = createGeminiImageEditor({
    apiKey: "secret",
    fetchImpl: (async (_url: string | URL | Request, init?: RequestInit) => {
      bodies.push(JSON.parse(String(init?.body)));
      return new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ inlineData: { mimeType: "image/png", data: "head" } }] } }]
        }),
        { status: 200 }
      );
    }) as typeof fetch
  });

  const image = await editor.generate({
    prompt: "paint",
    sourceImage: { mimeType: "image/jpeg", base64: "photo" },
    referenceImages: [{ mimeType: "image/png", base64: "style" }]
  });

  assert.deepEqual(image, { mimeType: "image/png", base64: "head" });
  assert.deepEqual(
    (bodies[0] as { contents: [{ parts: unknown[] }] }).contents[0].parts.slice(1),
    [
      { inlineData: { mimeType: "image/jpeg", data: "photo" } },
      { inlineData: { mimeType: "image/png", data: "style" } }
    ]
  );
});
