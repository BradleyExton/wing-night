// The avatar head pipeline: a photo goes to Gemini with the house prompt, a flat caricature comes
// back on magenta, and the magenta is keyed out to alpha so a bird can wear the head. One copy,
// shared by `pnpm import:avatars`, the LAN server's image editor, the teaser Worker and the
// guest's browser — so it touches no runtime's globals and imports its own files with `.ts`
// suffixes, which plain `node` can run with type stripping (see tsconfig.json). Decoding and
// encoding pictures is the caller's job: a canvas in a browser, Playwright's Chromium in the tool.
export {
  CHROMA_KEY,
  CHROMA_KEY_HEX,
  cropPixels,
  keyAndCropHead,
  knockOutBackground,
  opaqueBounds,
  type KeyColour,
  type KnockOutOptions,
  type PixelBounds,
  type RgbaImage
} from "./chromaKey/index.ts";
export {
  DEFAULT_GEMINI_IMAGE_MODEL,
  GEMINI_API_BASE,
  buildGeminiImageRequest,
  buildGeminiImageRequestTemplate,
  buildGeminiImageUrl,
  fillGeminiImageRequestTemplate,
  mimeTypeForImageFile,
  type GeminiGenerationConfig,
  type GeminiImageRequest,
  type GeminiImageRequestInput,
  type GeminiImageRequestTemplateInput,
  type GeminiRequestPart,
  type InlineImage
} from "./geminiRequest/index.ts";
export { extractGeneratedImage } from "./geminiResponse/index.ts";
export { assemblePrompt, type HeadPromptInput } from "./headPrompt/index.ts";
export {
  HEAD_ASPECT_RATIO,
  buildHeadRequest,
  buildHeadRequestTemplate,
  type HeadRequestInput,
  type HeadRequestTemplateInput
} from "./headRequest/index.ts";
export { slugifyName } from "./slugifyName/index.ts";
