import type { OutfitsByGenre } from "../outfit/index.js";

export type Player = {
  id: string;
  name: string;
  avatarSrc?: string;
  // What the bird wears, per genre (`packages/shared/src/outfit`). Every genre
  // the guest ever dressed for comes down with them, and a surface draws the
  // one for the player's CURRENT team, through `resolveWornOutfit` — so a
  // reseat on the night keeps them dressed, and an item cut since they chose it
  // is simply not drawn. Absent is a bare bird.
  outfits?: OutfitsByGenre;
};
