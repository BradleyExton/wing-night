import assert from "node:assert/strict";
import test from "node:test";

import { CHROMA_KEY, buildGeminiImageUrl, extractGeneratedImage, keyAndCropHead } from "@wingnight/avatar-head";

import { decodePng } from "../testing/png/index.ts";
import {
  createFakeHeadPainter,
  createGeminiHeadPainter,
  resolveHeadPainter,
  type GeminiHeadPainterOptions,
  type HeadPaintRequest
} from "./index.ts";

const BODY_TEXT = '{"contents":[]}';

const paintRequest = (): HeadPaintRequest & { cancelled: () => boolean } => {
  let cancelled = false;
  const body = new ReadableStream<Uint8Array>({
    start: (controller) => {
      controller.enqueue(new TextEncoder().encode(BODY_TEXT));
      controller.close();
    },
    cancel: () => {
      cancelled = true;
    }
  });

  return { body, byteLength: BODY_TEXT.length, cancelled: () => cancelled };
};

type FetchCall = { input: string; init: RequestInit };

const geminiOptions = (overrides: Partial<GeminiHeadPainterOptions> = {}) => {
  const calls: FetchCall[] = [];
  const sized: number[] = [];
  const reply = new Response('{"candidates":[]}', { status: 200 });
  const options: GeminiHeadPainterOptions = {
    apiKey: "test-gemini-key",
    model: "gemini-test-image",
    fetch: async (input, init) => {
      calls.push({ input, init });
      return reply;
    },
    sizeBody: (body, byteLength) => {
      sized.push(byteLength);
      return body;
    },
    ...overrides
  };

  return { options, calls, sized, reply };
};

test("does answer with a magenta head that keys to a face when the fake paints", async () => {
  const request = paintRequest();
  const response = await createFakeHeadPainter().paint(request);
  const image = extractGeneratedImage(JSON.parse(await response.text()));
  const pixels = decodePng(Uint8Array.from(atob(image.base64), (character) => character.charCodeAt(0)));

  assert.equal(image.mimeType, "image/png");
  assert.deepEqual([...pixels.pixels.subarray(0, 4)], [CHROMA_KEY.r, CHROMA_KEY.g, CHROMA_KEY.b, 255], "a magenta corner");

  const head = keyAndCropHead(pixels);

  assert.ok(head !== null, "keying left a head");
  assert.ok(head.width > 20 && head.width < pixels.width, `cropped to the face, ${head.width} wide`);
  assert.ok(head.height > 20 && head.height < pixels.height, `cropped to the face, ${head.height} tall`);
});

test("does stream the body to the model's URL with the key and its length when the real transport paints", async () => {
  const { options, calls, sized, reply } = geminiOptions();
  const request = paintRequest();
  const response = await createGeminiHeadPainter(options).paint(request);
  const [call] = calls;

  assert.equal(response, reply, "Gemini's reply comes back as it arrived");
  assert.equal(call?.input, buildGeminiImageUrl("gemini-test-image"));
  assert.equal(call?.init.method, "POST");
  assert.deepEqual(call?.init.headers, {
    "x-goog-api-key": "test-gemini-key",
    "Content-Type": "application/json",
    "Accept-Encoding": "identity"
  });
  assert.ok(call?.init.body instanceof ReadableStream, "the body goes as a stream, never a string");
  assert.equal(await new Response(call.init.body).text(), BODY_TEXT);
  assert.deepEqual(sized, [BODY_TEXT.length]);
  assert.ok(call?.init.signal instanceof AbortSignal, "the call has a timeout");
});

test("does throw and call nobody when the real transport has no API key", async () => {
  const { options, calls } = geminiOptions({ apiKey: "" });
  const request = paintRequest();

  await assert.rejects(createGeminiHeadPainter(options).paint(request), /GEMINI_API_KEY/);
  assert.equal(calls.length, 0);
  assert.equal(request.cancelled(), true, "the stored photo's stream is released");
});

test("does fail closed when GEMINI_TRANSPORT is not a transport it knows", async () => {
  const { options, calls } = geminiOptions();
  const painter = resolveHeadPainter({ transport: "gemeni", gemini: options });

  await assert.rejects(painter.paint(paintRequest()), /GEMINI_TRANSPORT "gemeni"/);
  assert.equal(calls.length, 0);
});
