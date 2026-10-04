import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import {
  buildGeminiImageRequest as buildSharedGeminiImageRequest,
  buildGeminiImageUrl,
  DEFAULT_GEMINI_IMAGE_MODEL,
  extractGeneratedImage,
  GEMINI_API_BASE,
  mimeTypeForImageFile,
  type GeminiImageRequest,
  type InlineImage
} from "@wingnight/avatar-head";

// RECREATE's Gemini image call: the party-time generator (the forger) and the
// author-time importer (`pnpm import:recreate`) both send it. The request and
// reply shapes are the shared ones in @wingnight/avatar-head, which
// `pnpm import:avatars` and the teaser Worker's head painter send too; this
// module adds what only the LAN server needs — reading pack images, the API key
// from the pack, and a timeout.
// Nothing here touches room state: it takes a prompt and optional pictures and
// hands back bytes, or throws with the model's own reason.

export {
  buildGeminiImageUrl,
  DEFAULT_GEMINI_IMAGE_MODEL,
  extractGeneratedImage,
  GEMINI_API_BASE,
  mimeTypeForImageFile
};
export const GEMINI_API_KEY_ENV = "GEMINI_API_KEY";

// Long enough for the model to paint, short enough that a stuck call does not
// hold a party turn hostage: the reducer treats a timeout as a failed attempt
// and the host scores the prompt anyway.
export const DEFAULT_GEMINI_TIMEOUT_MS = 90_000;

export type GeneratedImage = InlineImage;

export type ImageEditRequest = {
  prompt: string;
  // The picture to edit; null asks for a fresh image from the prompt alone.
  sourceImage: GeneratedImage | null;
  // Further pictures attached after the source, in order — a style reference
  // the new image should match, say. The prompt has to say which is which.
  referenceImages?: readonly GeneratedImage[];
  // Only honoured when there is no source image: an edit keeps its source's
  // frame.
  aspectRatio?: string;
};

export type ImageEditor = {
  model: string;
  generate: (request: ImageEditRequest) => Promise<GeneratedImage>;
};

export const extensionForMimeType = (mimeType: string): string => {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/webp") return "webp";

  return "png";
};

const ABSOLUTE_URL_PATTERN = /^[a-z][a-z0-9+.-]*:/i;

// Reads a pack-relative image (`geo/cottage.jpg`) from the first directory
// that has it, as the inline part a request attaches. A leading-slash or
// absolute path is sample placeholder art or something off-pack: nothing to
// attach, so the caller paints from the prompt alone.
export const readImageFromDirs = (
  dirs: string[],
  relativePath: string | null
): GeneratedImage | null => {
  if (
    relativePath === null ||
    relativePath.startsWith("/") ||
    ABSOLUTE_URL_PATTERN.test(relativePath)
  ) {
    return null;
  }

  const mimeType = mimeTypeForImageFile(relativePath);

  if (mimeType === null) {
    return null;
  }

  for (const dir of dirs) {
    const candidatePath = resolve(dir, relativePath);

    if (existsSync(candidatePath)) {
      return { mimeType, base64: readFileSync(candidatePath).toString("base64") };
    }
  }

  return null;
};

export const buildGeminiImageRequest = ({
  prompt,
  sourceImage,
  referenceImages = [],
  aspectRatio
}: ImageEditRequest): GeminiImageRequest => {
  return buildSharedGeminiImageRequest({
    prompt,
    images: sourceImage === null ? referenceImages : [sourceImage, ...referenceImages],
    aspectRatio: sourceImage === null ? aspectRatio : undefined
  });
};

type ResolveGeminiApiKeyInput = {
  contentRootDir: string;
  env: Record<string, string | undefined>;
};

// An exported key in the shell wins; otherwise the pack's own `.env`, which
// is where `pnpm import:avatars` keeps it — one key file beside the content it
// generates, not one per worktree. Parsed by hand rather than loaded into
// process.env so a boot never leaks the pack's variables into the process.
export const resolveGeminiApiKey = ({
  contentRootDir,
  env
}: ResolveGeminiApiKeyInput): string | null => {
  const fromEnv = env[GEMINI_API_KEY_ENV]?.trim();

  if (fromEnv) {
    return fromEnv;
  }

  const packEnvPath = join(contentRootDir, ".env");

  if (!existsSync(packEnvPath)) {
    return null;
  }

  for (const line of readFileSync(packEnvPath, "utf8").split(/\r?\n/)) {
    const match = /^\s*(?:export\s+)?GEMINI_API_KEY\s*=\s*(.*?)\s*$/.exec(line);

    if (match?.[1] !== undefined) {
      const value = match[1].replace(/^(['"])(.*)\1$/, "$2").trim();
      return value.length === 0 ? null : value;
    }
  }

  return null;
};

type CreateGeminiImageEditorInput = {
  apiKey: string;
  model?: string;
  timeoutMs?: number;
  // Injected for tests; defaults to the global fetch.
  fetchImpl?: typeof fetch;
};

export const createGeminiImageEditor = ({
  apiKey,
  model = DEFAULT_GEMINI_IMAGE_MODEL,
  timeoutMs = DEFAULT_GEMINI_TIMEOUT_MS,
  fetchImpl = fetch
}: CreateGeminiImageEditorInput): ImageEditor => {
  return {
    model,
    generate: async (request) => {
      const response = await fetchImpl(buildGeminiImageUrl(model), {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify(buildGeminiImageRequest(request)),
        signal: AbortSignal.timeout(timeoutMs)
      });

      if (!response.ok) {
        throw new Error(`Gemini ${response.status}: ${(await response.text()).slice(0, 400)}`);
      }

      return extractGeneratedImage(await response.json());
    }
  };
};
