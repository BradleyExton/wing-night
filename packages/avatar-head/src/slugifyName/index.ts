// A player's name as a file name: `Steve B` -> `steve-b`. The import tool matches source photos
// to roster entries by it and names each head after it.
export const slugifyName = (name: string): string =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
