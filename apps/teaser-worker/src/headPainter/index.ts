// Paints a guest's avatar head: hands Gemini a generateContent request body and returns its reply
// unread. `GEMINI_TRANSPORT` picks: "gemini" is the real model, "fake" (local dev and tests) costs
// nothing and answers with a canned reply carrying a magenta test head. Anything else fails
// closed, every paint throwing, rather than quietly painting fakes in production.
//
// The body arrives as a stream with its length known up front (src/headRequestBody builds it), and
// the reply leaves as a Response whose body has not been touched: on the Workers free plan a
// request gets 10 ms of CPU, and a head is a megabyte or two of base64 each way, so nothing here
// may parse, encode or even buffer it.
import { buildGeminiImageUrl } from "@wingnight/avatar-head";

import { FAKE_GENERATE_CONTENT_RESPONSE } from "./fakeHead.ts";

export type HeadPaintRequest = {
  // The generateContent JSON, streamed.
  body: ReadableStream<Uint8Array>;
  byteLength: number;
};

export type HeadPainter = {
  paint(request: HeadPaintRequest): Promise<Response>;
};

export const GEMINI_TRANSPORTS = ["gemini", "fake"] as const;

// Gemini's image model can take most of a minute; past two, the guest is better off trying again.
export const GEMINI_TIMEOUT_MS = 120_000;

export type GeminiHeadPainterOptions = {
  apiKey: string | undefined;
  model: string;
  fetch: (input: string, init: RequestInit) => Promise<Response>;
  // Gives the stream its length, so the upload goes with a Content-Length instead of chunked:
  // workerd's FixedLengthStream in the Worker, nothing at all in a test.
  sizeBody: (body: ReadableStream<Uint8Array>, byteLength: number) => ReadableStream<Uint8Array>;
};

export const createGeminiHeadPainter = ({ apiKey, model, fetch, sizeBody }: GeminiHeadPainterOptions): HeadPainter => ({
  paint: async ({ body, byteLength }) => {
    if (apiKey === undefined || apiKey.length === 0) {
      await body.cancel();
      throw new Error("GEMINI_API_KEY is not set.");
    }

    return fetch(buildGeminiImageUrl(model), {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
        // Uncompressed, so the runtime has nothing to inflate on the way through: inflating two
        // megabytes is CPU the free plan does not have, and base64 barely compresses anyway.
        "Accept-Encoding": "identity"
      },
      body: sizeBody(body, byteLength),
      signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS)
    });
  }
});

// Reads the request through, as Gemini would, and answers with the canned head.
export const createFakeHeadPainter = (): HeadPainter => ({
  paint: async ({ body }) => {
    await new Response(body).arrayBuffer();

    return new Response(FAKE_GENERATE_CONTENT_RESPONSE, { headers: { "Content-Type": "application/json" } });
  }
});

const createUnavailableHeadPainter = (reason: string): HeadPainter => ({
  paint: async ({ body }) => {
    await body.cancel();
    throw new Error(reason);
  }
});

type HeadPainterEnvironment = {
  transport: string | undefined;
  gemini: GeminiHeadPainterOptions;
};

export const resolveHeadPainter = ({ transport, gemini }: HeadPainterEnvironment): HeadPainter => {
  switch (transport) {
    case "gemini":
      return createGeminiHeadPainter(gemini);
    case "fake":
      return createFakeHeadPainter();
    default:
      return createUnavailableHeadPainter(
        `GEMINI_TRANSPORT ${JSON.stringify(transport)} is not one of ${GEMINI_TRANSPORTS.join(", ")}.`
      );
  }
};
