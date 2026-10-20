import type { GenreKey } from "../teamTheme/index.js";

// The wardrobe's vocabulary (docs/research/bird-wardrobe.md §2.1, §2.7). It
// lives in shared because four packages read it: the server's loader, the
// cast that draws it, the Worker that will take it from a guest's phone, and
// the pull that brings it down to the pack.

/**
 * Seven slots, each on its own region of the bird so two items never fight for
 * the same pixels. The KIT rides the bird everywhere, minigames included; the
 * SHOWPIECES are only drawn where the bird is on show (the lobby parade, the
 * intro lineup, the portal), because a prop in a game reads as a weapon, a game
 * owns its ground, and a sim owns the pose.
 */
export const OUTFIT_SLOTS = ["top", "sleeve", "tail", "boots", "prop", "stage", "move"] as const;
export type OutfitSlot = (typeof OUTFIT_SLOTS)[number];

export const OUTFIT_KIT_SLOTS = ["top", "sleeve", "tail", "boots"] as const satisfies readonly OutfitSlot[];
export type OutfitKitSlot = (typeof OUTFIT_KIT_SLOTS)[number];

export const OUTFIT_SHOWPIECE_SLOTS = ["prop", "stage", "move"] as const satisfies readonly OutfitSlot[];
export type OutfitShowpieceSlot = (typeof OUTFIT_SHOWPIECE_SLOTS)[number];

/**
 * An item's authored palettes for its base region, judged at 76px on its
 * genre's body. Not a colour picker: `team` is the wearer's own team colour,
 * and gold is the one accent the wardrobe adds, only ever offered, never first.
 */
export const OUTFIT_STYLES = ["ink", "white", "team", "gold"] as const;
export type OutfitStyle = (typeof OUTFIT_STYLES)[number];

/** The genres with a rail of their own. Every other genre dresses from the shared rail. */
export const OUTFIT_GENRES = ["metal", "pop", "country", "disco"] as const satisfies readonly GenreKey[];
export type OutfitGenre = (typeof OUTFIT_GENRES)[number];

/** Whose rail an item hangs on: one genre's, or the shared rail any team can wear. */
export type OutfitRail = OutfitGenre | "shared";

export type OutfitItem = {
  /** Permanent, kebab: `flying-v-a`. */
  id: string;
  slot: OutfitSlot;
  genre: OutfitRail;
  /** What the picker's status line says when a guest taps it. */
  name: string;
  /** First is the default. Empty for a Move, which is a pose and has no palette. */
  styles: readonly OutfitStyle[];
};

export type OutfitChoice = { item: string; style?: OutfitStyle };

/** One bird's outfit for one genre: a choice per slot, or nothing there. */
export type Outfit = Partial<Record<OutfitSlot, OutfitChoice>>;

/**
 * A guest's outfits, kept per genre, so a bird dressed for metal is still
 * dressed for metal after its owner tries disco — and still dressed if Brad
 * reseats them on the night.
 */
export type OutfitsByGenre = Partial<Record<GenreKey, Outfit>>;

export type OutfitLook = {
  id: string;
  name: string;
  outfit: Outfit;
};
