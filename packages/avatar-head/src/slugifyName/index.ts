// A player's name as a file name: `Steve B` -> `steve-b`. The import tool matches source photos
// to roster entries by it and names each head after it, and `pnpm pack:pull` matches portal guests
// to players by it. Accents are folded first (NFD, combining marks dropped), so `Zoë` is `zoe`
// rather than `zo`, and `José` is `jose` — never `jos`, which would be somebody else.
export const slugifyName = (name: string): string =>
  name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
