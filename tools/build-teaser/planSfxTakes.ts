// A game's recorded takes as the teaser serves them: the same listing the party server answers
// `/sfx-takes/<game>` with (apps/server/src/routes/sfxTakes — `listSfxTakes`), written out as a
// file because the site has no server. Re-derived rather than imported, because the route module
// brings Express with it; the rule is small and the test below pins it to the server's:
// `<cue>.mp3` or `<cue>-<anything>.mp3`, grouped by the cue before the first dash, each take a
// root-relative path under /content-assets/sfx/<game>/, sorted.
const TAKE_FILE_PATTERN = /^([A-Za-z0-9]+)(?:-[^/]*)?\.(?:mp3|wav|ogg|m4a)$/i;

export type SfxTakesListing = { takes: Record<string, string[]> };

export type SfxTakesPlan = {
  listing: SfxTakesListing;
  // The files the listing names, to copy into the site beside it.
  fileNames: string[];
};

export const planSfxTakes = (game: string, fileNames: readonly string[]): SfxTakesPlan => {
  const takes: Record<string, string[]> = {};
  const listed: string[] = [];

  for (const fileName of fileNames) {
    const cue = TAKE_FILE_PATTERN.exec(fileName)?.[1];

    if (cue === undefined) {
      continue;
    }

    listed.push(fileName);
    (takes[cue] ??= []).push(`/content-assets/sfx/${game}/${encodeURIComponent(fileName)}`);
  }

  for (const paths of Object.values(takes)) {
    paths.sort((left, right) => left.localeCompare(right));
  }

  return { listing: { takes }, fileNames: listed };
};
