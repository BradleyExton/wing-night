import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

// The one Gemini image call this repo makes, in TypeScript so the party-time
// generator (RECREATE's forger) and the author-time importer
// (`pnpm import:recreate`) send the same request and read the same reply.
// Nothing here touches room state: it takes a prompt and an optional source
// picture and hands back bytes, or throws with the model's own reason.

// Nano Banana 2. The older gemini-2.5-flash-image is retired on 2026-10-02.
export const DEFAULT_GEMINI_IMAGE_MODEL = "gemini-3.1-flash-image";
export const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
export const GEMINI_API_KEY_ENV = "GEMINI_API_KEY";

// Long enough for the model to paint, short enough that a stuck call does not
// hold a party turn hostage: the reducer treats a timeout as a failed attempt
// and the host scores the prompt anyway.
export const DEFAULT_GEMINI_TIMEOUT_MS = 90_000;

export type GeneratedImage = {
  mimeType: string;
  base64: string;
};

export type ImageEditRequest = {
  prompt: string;
  // The picture to edit; null asks for a fresh image from the prompt alone.
  sourceImage: GeneratedImage | null;
  // Only honoured when there is no source image: an edit keeps its source's
  // frame.
  aspectRatio?: string;
};

export type ImageEditor = {
  model: string;
  generate: (request: ImageEditRequest) => Promise<GeneratedImage>;
};

export const mimeTypeForImageFile = (fileName: string): string | null => {
  const extension = fileName.toLowerCase().split(".").pop();

  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  if (extension === "heic") return "image/heic";

  return null;
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

export const buildGeminiImageUrl = (model: string): string => {
  return `${GEMINI_API_BASE}/${model}:generateContent`;
};

export const buildGeminiImageRequest = ({
  prompt,
  sourceImage,
  aspectRatio
}: ImageEditRequest): Record<string, unknown> => {
  const parts: Record<string, unknown>[] = [{ text: prompt }];

  if (sourceImage !== null) {
    parts.push({
      inlineData: { mimeType: sourceImage.mimeType, data: sourceImage.base64 }
    });
  }

  const imageConfig =
    sourceImage === null && aspectRatio !== undefined ? { aspectRatio } : undefined;

  return {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ["IMAGE"],
      ...(imageConfig === undefined ? {} : { imageConfig })
    }
  };
};

type GeminiCandidatePart = { inlineData?: { mimeType?: string; data?: string }; text?: string };

// Returns the first image part, or throws with the model's own text so a
// refusal reads as a reason on the TV rather than a stack trace in the log.
export const extractGeneratedImage = (response: unknown): GeneratedImage => {
  const candidate =
    typeof response === "object" && response !== null && "candidates" in response
      ? (response as { candidates?: unknown[] }).candidates?.[0]
      : undefined;
  const parts: GeminiCandidatePart[] =
    typeof candidate === "object" && candidate !== null && "content" in candidate
      ? ((candidate as { content?: { parts?: GeminiCandidatePart[] } }).content?.parts ?? [])
      : [];
  const imagePart = parts.find((part) => typeof part.inlineData?.data === "string");

  if (imagePart?.inlineData?.data === undefined) {
    const text = parts
      .map((part) => part.text)
      .filter((part): part is string => typeof part === "string")
      .join(" ")
      .trim();
    const finishReason =
      typeof candidate === "object" && candidate !== null && "finishReason" in candidate
        ? String((candidate as { finishReason?: unknown }).finishReason)
        : "unknown";

    throw new Error(
      `No image in response (finishReason: ${finishReason})${text ? `: ${text}` : ""}`
    );
  }

  return {
    mimeType: imagePart.inlineData.mimeType ?? "image/png",
    base64: imagePart.inlineData.data
  };
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
