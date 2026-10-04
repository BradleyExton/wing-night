// The Gemini image call's request side: where it goes and what it carries. Shared by the LAN
// server's image editor (RECREATE), the import tools and the teaser Worker, so every caller sends
// the same body and a fix lands once.

// Nano Banana 2. The older gemini-2.5-flash-image is retired on 2026-10-02.
export const DEFAULT_GEMINI_IMAGE_MODEL = "gemini-3.1-flash-image";
export const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

// A picture as the API carries it, inline: standard base64, no line breaks.
export type InlineImage = {
  mimeType: string;
  base64: string;
};

export type GeminiRequestPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

export type GeminiGenerationConfig = {
  responseModalities: ["IMAGE"];
  imageConfig?: { aspectRatio: string };
};

export type GeminiImageRequest = {
  contents: [{ parts: GeminiRequestPart[] }];
  generationConfig: GeminiGenerationConfig;
};

export type GeminiImageRequestInput = {
  prompt: string;
  // Attached after the prompt, in this order; the prompt says which is which.
  images: readonly InlineImage[];
  // Sent as `imageConfig` when given. Whether a caller should send it (an edit keeps its source's
  // frame) is the caller's call, not this builder's.
  aspectRatio?: string;
};

export const mimeTypeForImageFile = (fileName: string): string | null => {
  const extension = fileName.toLowerCase().split(".").pop();

  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  if (extension === "heic") return "image/heic";

  return null;
};

export const buildGeminiImageUrl = (model: string): string =>
  `${GEMINI_API_BASE}/${model}:generateContent`;

const buildGenerationConfig = (aspectRatio: string | undefined): GeminiGenerationConfig =>
  aspectRatio === undefined
    ? { responseModalities: ["IMAGE"] }
    : { responseModalities: ["IMAGE"], imageConfig: { aspectRatio } };

export const buildGeminiImageRequest = ({
  prompt,
  images,
  aspectRatio
}: GeminiImageRequestInput): GeminiImageRequest => ({
  contents: [
    {
      parts: [
        { text: prompt },
        ...images.map((image) => ({ inlineData: { mimeType: image.mimeType, data: image.base64 } }))
      ]
    }
  ],
  generationConfig: buildGenerationConfig(aspectRatio)
});

export type GeminiImageRequestTemplateInput = {
  prompt: string;
  imageMimeTypes: readonly string[];
  aspectRatio?: string;
};

// The same body as `JSON.stringify(buildGeminiImageRequest(…))`, cut open at each image's base64:
// one more segment than there are images, so the body is segment 0, image 0's base64, segment 1,
// image 1's base64 … the last segment. A caller holding the pictures as stored base64 text (the
// teaser Worker, on a CPU budget) streams those pieces end to end and never parses, re-encodes or
// even concatenates the image bytes. Base64 needs no JSON escaping, so it drops in verbatim.
export const buildGeminiImageRequestTemplate = ({
  prompt,
  imageMimeTypes,
  aspectRatio
}: GeminiImageRequestTemplateInput): string[] => {
  const segments: string[] = [];
  let open = `{"contents":[{"parts":[${JSON.stringify({ text: prompt })}`;

  for (const mimeType of imageMimeTypes) {
    segments.push(`${open},{"inlineData":{"mimeType":${JSON.stringify(mimeType)},"data":"`);
    open = `"}}`;
  }

  segments.push(`${open}]}],"generationConfig":${JSON.stringify(buildGenerationConfig(aspectRatio))}}`);
  return segments;
};

// Zips a template with its images' base64, in order. For a caller that does want one string.
export const fillGeminiImageRequestTemplate = (
  segments: readonly string[],
  base64Images: readonly string[]
): string => {
  if (segments.length !== base64Images.length + 1) {
    throw new Error(
      `A request template with ${segments.length} segments takes ${segments.length - 1} images, not ${base64Images.length}.`
    );
  }

  return segments.reduce((body, segment, index) => body + segment + (base64Images[index] ?? ""), "");
};
