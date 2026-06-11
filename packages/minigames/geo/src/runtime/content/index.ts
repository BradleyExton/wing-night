import {
  isGeoContentFile,
  isGeoPrompt,
  type GeoPrompt
} from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import type { GeoRuntimeContent } from "../types/index.js";

export const cloneGeoPrompt = (prompt: GeoPrompt): GeoPrompt => {
  return {
    id: prompt.id,
    title: prompt.title,
    imageSrc: prompt.imageSrc,
    ...(prompt.hint === undefined ? {} : { hint: prompt.hint }),
    answer: {
      lat: prompt.answer.lat,
      lng: prompt.answer.lng
    }
  };
};

export const parseGeoContentFile = (
  rawContent: string,
  contentFilePath: string
): GeoRuntimeContent => {
  let parsedContent: unknown;

  try {
    parsedContent = JSON.parse(rawContent);
  } catch (error) {
    const parseReason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to parse geo content at "${contentFilePath}": ${parseReason}`
    );
  }

  if (!isGeoContentFile(parsedContent)) {
    throw new Error(
      `Invalid geo content at "${contentFilePath}": expected { prompts: [{ id, title, imageSrc, answer: { lat, lng } }] } with unique ids and in-range coordinates.`
    );
  }

  return {
    prompts: parsedContent.prompts.map(cloneGeoPrompt)
  };
};

export const resolveGeoContent = (
  content: SerializableValue | null
): GeoRuntimeContent => {
  if (typeof content !== "object" || content === null) {
    return { prompts: [] };
  }

  if (!("prompts" in content) || !Array.isArray(content.prompts)) {
    return { prompts: [] };
  }

  const prompts = content.prompts.filter((prompt): prompt is GeoPrompt => {
    return isGeoPrompt(prompt);
  });

  return {
    prompts: prompts.map(cloneGeoPrompt)
  };
};
