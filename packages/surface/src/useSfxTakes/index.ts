import { useEffect, useState } from "react";

// Keyed by cue name, each an absolute URL the TV can fetch.
export type SfxTakeUrls = Readonly<Record<string, readonly string[]>>;

const NO_TAKES: SfxTakeUrls = {};

// Pure: the server's take listing (`SfxTakesListing` in @wingnight/shared),
// with each root-relative path resolved against the URL it was fetched from —
// the server cannot know which origin the TV reached it on. Anything that is
// not the listing's shape is no takes, never an exception.
export const resolveSfxTakeUrls = (listing: unknown, listingUrl: string): SfxTakeUrls => {
  if (typeof listing !== "object" || listing === null || !("takes" in listing)) {
    return NO_TAKES;
  }

  const { takes } = listing;

  if (typeof takes !== "object" || takes === null) {
    return NO_TAKES;
  }

  const urls: Record<string, string[]> = {};

  for (const [cue, paths] of Object.entries(takes)) {
    if (!Array.isArray(paths)) {
      continue;
    }

    const resolved = paths.flatMap((path): string[] => {
      if (typeof path !== "string") {
        return [];
      }

      try {
        return [new URL(path, listingUrl).href];
      } catch {
        return [];
      }
    });

    if (resolved.length > 0) {
      urls[cue] = resolved;
    }
  }

  return urls;
};

// A game's recorded takes, fetched once from `listingUrl` (see
// `resolveSfxTakesUrl`). Empty until the listing lands, and empty for good if it
// never does: a room that cannot reach the listing plays its synthesis. The
// same object for as long as the URL holds, so a board keyed on it is made once.
export const useSfxTakes = (listingUrl: string | null): SfxTakeUrls => {
  const [takes, setTakes] = useState<SfxTakeUrls>(NO_TAKES);

  useEffect(() => {
    if (listingUrl === null) {
      setTakes(NO_TAKES);
      return;
    }

    let cancelled = false;

    fetch(listingUrl)
      .then((response) => (response.ok ? response.json() : null))
      .then((listing: unknown) => {
        if (!cancelled) {
          setTakes(resolveSfxTakeUrls(listing, listingUrl));
        }
      })
      .catch(() => {
        // Synthesis it is.
      });

    return (): void => {
      cancelled = true;
    };
  }, [listingUrl]);

  return takes;
};
