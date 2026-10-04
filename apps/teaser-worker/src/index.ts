// The Worker's entry: turns the bindings in wrangler.jsonc into the portal's deps and hands the
// request to the app. Nothing else in src/ touches a workerd type, so the tests run on Node.
import { DEFAULT_GEMINI_IMAGE_MODEL } from "@wingnight/avatar-head";

import { handleRequest } from "./app/index.ts";
import { resolveHeadPainter } from "./headPainter/index.ts";
import { resolveMailTransport } from "./mail/index.ts";

type Env = {
  ASSETS: Fetcher;
  DB: D1Database;
  BUCKET: R2Bucket;
  SIGNIN_LIMITER: RateLimit;
  MAIL_TRANSPORT?: string;
  MAIL_FROM?: string;
  GEMINI_TRANSPORT?: string;
  PUBLIC_ORIGIN?: string;
  // Secrets (`wrangler secret put`), never in wrangler.jsonc.
  RESEND_API_KEY?: string;
  GEMINI_API_KEY?: string;
  ADMIN_API_TOKEN?: string;
};

const DEFAULT_MAIL_FROM = "party@wingnight.tv";

const logError = (message: string, error?: unknown): void => {
  console.error(`[portal] ${message}`, error ?? "");
};

// The Gemini request is streamed from R2; this tells fetch its length so it uploads with a
// Content-Length rather than chunked.
const sizeBody = (body: ReadableStream<Uint8Array>, byteLength: number): ReadableStream<Uint8Array> => {
  const sized = new FixedLengthStream(byteLength);

  body.pipeTo(sized.writable).catch((error: unknown) => logError("avatar: the Gemini request body broke", error));

  return sized.readable;
};

export default {
  fetch: (request: Request, env: Env, ctx: ExecutionContext): Promise<Response> => {
    return handleRequest(request, {
      db: env.DB,
      bucket: env.BUCKET,
      mail: resolveMailTransport({
        transport: env.MAIL_TRANSPORT,
        resend: {
          apiKey: env.RESEND_API_KEY,
          from: env.MAIL_FROM ?? DEFAULT_MAIL_FROM,
          fetch: (input, init) => fetch(input, init)
        },
        log: (line) => console.warn(line)
      }),
      gemini: resolveHeadPainter({
        transport: env.GEMINI_TRANSPORT,
        gemini: {
          apiKey: env.GEMINI_API_KEY,
          model: DEFAULT_GEMINI_IMAGE_MODEL,
          fetch: (input, init) => fetch(input, init),
          sizeBody
        }
      }),
      signInLimiter: env.SIGNIN_LIMITER,
      assets: env.ASSETS,
      publicOrigin: env.PUBLIC_ORIGIN !== undefined && env.PUBLIC_ORIGIN.length > 0 ? env.PUBLIC_ORIGIN : null,
      adminApiToken: env.ADMIN_API_TOKEN !== undefined && env.ADMIN_API_TOKEN.length > 0 ? env.ADMIN_API_TOKEN : null,
      now: () => Date.now(),
      random: (byteCount) => crypto.getRandomValues(new Uint8Array(byteCount)),
      defer: (work) => ctx.waitUntil(work),
      logError
    });
  }
} satisfies ExportedHandler<Env>;
