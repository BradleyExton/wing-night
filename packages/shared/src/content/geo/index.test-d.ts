import type { GeoContentFile, GeoCoordinates, GeoPrompt } from "../../index.js";

type Assert<T extends true> = T;
type IsAssignable<From, To> = From extends To ? true : false;

export type ValidGeoPromptCheck = Assert<
  IsAssignable<
    {
      id: string;
      title: string;
      imageSrc: string;
      hint: string;
      answer: { lat: number; lng: number };
    },
    GeoPrompt
  >
>;

export type ValidGeoPromptWithoutHintCheck = Assert<
  IsAssignable<
    {
      id: string;
      title: string;
      imageSrc: string;
      answer: { lat: number; lng: number };
    },
    GeoPrompt
  >
>;

export type ValidGeoContentFileCheck = Assert<
  IsAssignable<{ prompts: GeoPrompt[] }, GeoContentFile>
>;

export type ValidGeoCoordinatesCheck = Assert<
  IsAssignable<{ lat: number; lng: number }, GeoCoordinates>
>;

// @ts-expect-error Geo prompt requires an id.
export type MissingPromptIdCheck = Assert<IsAssignable<{ title: string; imageSrc: string; answer: GeoCoordinates }, GeoPrompt>>;

// @ts-expect-error Geo prompt requires a title.
export type MissingPromptTitleCheck = Assert<IsAssignable<{ id: string; imageSrc: string; answer: GeoCoordinates }, GeoPrompt>>;

// @ts-expect-error Geo prompt requires an imageSrc.
export type MissingPromptImageSrcCheck = Assert<IsAssignable<{ id: string; title: string; answer: GeoCoordinates }, GeoPrompt>>;

// @ts-expect-error Geo prompt requires an answer.
export type MissingPromptAnswerCheck = Assert<IsAssignable<{ id: string; title: string; imageSrc: string }, GeoPrompt>>;

// @ts-expect-error Geo answer requires both lat and lng.
export type MissingAnswerLngCheck = Assert<IsAssignable<{ lat: number }, GeoCoordinates>>;

// @ts-expect-error prompts must be an array.
export type InvalidPromptsCollectionCheck = Assert<IsAssignable<{ prompts: string }, GeoContentFile>>;
