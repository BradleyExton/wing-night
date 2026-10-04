import type { InlineImage } from "../geminiRequest/index.ts";

type CandidatePart = { inlineData?: { mimeType?: unknown; data?: unknown }; text?: unknown };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const readParts = (candidate: unknown): CandidatePart[] => {
  if (!isRecord(candidate) || !isRecord(candidate.content)) return [];
  const parts = candidate.content.parts;
  return Array.isArray(parts) ? parts.filter(isRecord) : [];
};

// Returns the first image part of a generateContent reply, or throws with the model's own text so
// a refusal reads as a reason (on the TV, in the tool's log, on a guest's phone) rather than a
// crash. Takes the parsed JSON as `unknown`: it is someone else's payload.
export const extractGeneratedImage = (response: unknown): InlineImage => {
  const candidate =
    isRecord(response) && Array.isArray(response.candidates) ? response.candidates[0] : undefined;
  const parts = readParts(candidate);
  const imagePart = parts.find(
    (part) => typeof part.inlineData?.data === "string" && part.inlineData.data.length > 0
  );
  const data = imagePart?.inlineData?.data;

  if (typeof data !== "string") {
    const text = parts
      .map((part) => part.text)
      .filter((part): part is string => typeof part === "string")
      .join(" ")
      .trim();
    const finishReason =
      isRecord(candidate) && "finishReason" in candidate ? String(candidate.finishReason) : "unknown";

    throw new Error(`No image in response (finishReason: ${finishReason})${text ? `: ${text}` : ""}`);
  }

  const mimeType = imagePart?.inlineData?.mimeType;
  return { mimeType: typeof mimeType === "string" ? mimeType : "image/png", base64: data };
};
