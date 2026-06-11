export type GeoCoordinates = {
  lat: number;
  lng: number;
};

export type GeoPrompt = {
  id: string;
  title: string;
  imageSrc: string;
  hint?: string;
  answer: GeoCoordinates;
};

export type GeoContentFile = {
  prompts: GeoPrompt[];
};

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

const isLatitude = (value: unknown): value is number => {
  return typeof value === "number" && Number.isFinite(value) && value >= -90 && value <= 90;
};

const isLongitude = (value: unknown): value is number => {
  return typeof value === "number" && Number.isFinite(value) && value >= -180 && value <= 180;
};

export const isGeoCoordinates = (value: unknown): value is GeoCoordinates => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if (!("lat" in value) || !isLatitude(value.lat)) {
    return false;
  }

  if (!("lng" in value) || !isLongitude(value.lng)) {
    return false;
  }

  return true;
};

export const isGeoPrompt = (value: unknown): value is GeoPrompt => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if (!("id" in value) || !isNonEmptyString(value.id)) {
    return false;
  }

  if (!("title" in value) || !isNonEmptyString(value.title)) {
    return false;
  }

  if (!("imageSrc" in value) || !isNonEmptyString(value.imageSrc)) {
    return false;
  }

  if ("hint" in value && value.hint !== undefined && !isNonEmptyString(value.hint)) {
    return false;
  }

  if (!("answer" in value) || !isGeoCoordinates(value.answer)) {
    return false;
  }

  return true;
};

const hasUniquePromptIds = (prompts: GeoPrompt[]): boolean => {
  const ids = new Set(prompts.map((prompt) => prompt.id));
  return ids.size === prompts.length;
};

export const isGeoContentFile = (value: unknown): value is GeoContentFile => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if (!("prompts" in value) || !Array.isArray(value.prompts)) {
    return false;
  }

  if (value.prompts.length === 0) {
    return false;
  }

  if (!value.prompts.every((prompt) => isGeoPrompt(prompt))) {
    return false;
  }

  return hasUniquePromptIds(value.prompts);
};
