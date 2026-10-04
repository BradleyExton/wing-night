import {
  buildGeminiImageRequest,
  buildGeminiImageRequestTemplate,
  type GeminiImageRequest,
  type InlineImage
} from "../geminiRequest/index.ts";
import { assemblePrompt } from "../headPrompt/index.ts";

// Heads are square: the prompt asks for 1024×1024, and so does the request.
export const HEAD_ASPECT_RATIO = "1:1";

export type HeadRequestInput = {
  photo: InlineImage;
  // A finished head from the same set, sent second so the new one is drawn by the same hand.
  styleReference: InlineImage | null;
};

// The one request a head is painted from: the prompt that matches what is attached, the photo
// first, the style reference (if any) second.
export const buildHeadRequest = ({ photo, styleReference }: HeadRequestInput): GeminiImageRequest =>
  buildGeminiImageRequest({
    prompt: assemblePrompt({ hasStyleReference: styleReference !== null }),
    images: styleReference === null ? [photo] : [photo, styleReference],
    aspectRatio: HEAD_ASPECT_RATIO
  });

export type HeadRequestTemplateInput = {
  photoMimeType: string;
  styleReferenceMimeType: string | null;
};

// `buildHeadRequest` cut open for streaming (see buildGeminiImageRequestTemplate): two segments
// around the photo's base64, or three when a style reference's base64 follows it.
export const buildHeadRequestTemplate = ({
  photoMimeType,
  styleReferenceMimeType
}: HeadRequestTemplateInput): string[] =>
  buildGeminiImageRequestTemplate({
    prompt: assemblePrompt({ hasStyleReference: styleReferenceMimeType !== null }),
    imageMimeTypes:
      styleReferenceMimeType === null ? [photoMimeType] : [photoMimeType, styleReferenceMimeType],
    aspectRatio: HEAD_ASPECT_RATIO
  });
