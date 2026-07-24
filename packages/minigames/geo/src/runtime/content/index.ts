import {
  isGeoContentFile,
  isGeoPrompt,
  type GeoPrompt
} from "@wingnight/shared";
import { createPromptContentAdapter } from "@wingnight/minigames-core";

export const geoContentAdapter = createPromptContentAdapter<GeoPrompt>({
  label: "geo",
  fileName: "minigames/geo.json",
  invalidContentHint:
    "expected { prompts: [{ id, title, imageSrc, answer: { lat, lng } }] } with unique ids and in-range coordinates.",
  isContentFile: isGeoContentFile,
  isPrompt: isGeoPrompt,
  clonePrompt: (prompt) => ({
    id: prompt.id,
    title: prompt.title,
    imageSrc: prompt.imageSrc,
    ...(prompt.hint === undefined ? {} : { hint: prompt.hint }),
    answer: {
      lat: prompt.answer.lat,
      lng: prompt.answer.lng
    }
  })
});

export const cloneGeoPrompt = geoContentAdapter.clonePrompt;
export const parseGeoContentFile = geoContentAdapter.parseFileContent;
export const resolveGeoContent = geoContentAdapter.resolveContent;
