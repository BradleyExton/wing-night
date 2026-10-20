// The bird wardrobe (docs/research/bird-wardrobe.md): the slot vocabulary, the
// catalogue, the Looks, and the two readers.
//
// Two readers, because an outfit crosses two kinds of boundary:
//
// - `validateOutfit` / `parseOutfit` are STRICT, for a guest's write
//   (`PUT /api/me/outfit`): every slot must be a slot, every item must exist,
//   sit in that slot, hang on that genre's rail or the shared one, and wear a
//   style it lists. Anything else is refused whole.
// - `resolveWornOutfit` is TOLERANT, for everything downstream of a write that
//   was already accepted (the pack, the loader, the cast). It keeps every
//   choice it recognises and drops the rest, which is what lets Brad cut an
//   item after guests have worn it: their tile goes back to None.
//
// The pack's file shape is checked strictly too (`validateOutfitsByGenre`), the
// way every other players.json field is: a hand-typed `"Top"` or a choice
// that is a bare string fails the boot with a path. Only catalogue membership
// is left to the tolerant reader, because that is the part that changes under
// a guest after they chose.
//
// Imports carry the `.ts` suffix, like ../guestPortal's export and routes,
// because `pnpm pack:pull` reads a guest's outfits through this module under
// plain `node`, whose type stripping resolves no `.js` alias.
import { isNonEmptyString, isRecord } from "../guards/index.ts";
import { prefixIssuePaths, type ValidationIssue } from "../content/validationIssue/index.ts";
import { GENRE_KEYS, type GenreKey } from "../teamTheme/index.ts";
import { OUTFIT_ITEMS } from "./catalogue/index.ts";
import {
  OUTFIT_GENRES,
  OUTFIT_SLOTS,
  OUTFIT_STYLES,
  type Outfit,
  type OutfitChoice,
  type OutfitItem,
  type OutfitSlot,
  type OutfitStyle
} from "./types.ts";

export * from "./types.ts";
export { OUTFIT_ITEMS } from "./catalogue/index.ts";
export { OUTFIT_LOOKS } from "./looks/index.ts";

const ITEMS_BY_ID: ReadonlyMap<string, OutfitItem> = new Map(OUTFIT_ITEMS.map((item) => [item.id, item]));

export const findOutfitItem = (id: string): OutfitItem | undefined => ITEMS_BY_ID.get(id);

const isOutfitSlot = (value: string): value is OutfitSlot => (OUTFIT_SLOTS as readonly string[]).includes(value);

const isOutfitStyle = (value: unknown): value is OutfitStyle =>
  typeof value === "string" && (OUTFIT_STYLES as readonly string[]).includes(value);

const isGenreKey = (value: string): value is GenreKey => (GENRE_KEYS as readonly string[]).includes(value);

const hasRailOfItsOwn = (genre: GenreKey): boolean => (OUTFIT_GENRES as readonly GenreKey[]).includes(genre);

/**
 * The slots a genre's bird can be dressed in. Country's broody bird shows 2.3
 * units of leg, so boots would vanish: it has no Boots slot at all.
 */
export const resolveOutfitSlots = (genre: GenreKey): readonly OutfitSlot[] =>
  genre === "country" ? OUTFIT_SLOTS.filter((slot) => slot !== "boots") : OUTFIT_SLOTS;

/** Whether a bird of this genre may wear the item: its own rail, or the shared one. */
export const isOutfitItemOnRail = (item: OutfitItem, genre: GenreKey): boolean =>
  item.genre === "shared" || (hasRailOfItsOwn(genre) && item.genre === genre);

/** Every item a genre's wardrobe offers in one slot, its own rail first. */
export const resolveOutfitRail = (genre: GenreKey, slot: OutfitSlot): readonly OutfitItem[] => {
  if (!resolveOutfitSlots(genre).includes(slot)) {
    return [];
  }

  const onRail = OUTFIT_ITEMS.filter((item) => item.slot === slot && isOutfitItemOnRail(item, genre));

  return [...onRail.filter((item) => item.genre !== "shared"), ...onRail.filter((item) => item.genre === "shared")];
};

// Why one slot's choice cannot be worn by this genre, or null when it can. The
// one rule both readers share, so strict and tolerant can never disagree on
// what a valid choice is — only on what to do about an invalid one.
const refuseChoice = (genre: GenreKey, slot: OutfitSlot, choice: unknown): ValidationIssue | null => {
  if (!resolveOutfitSlots(genre).includes(slot)) {
    return { path: slot, message: `is not a slot a ${genre} bird has` };
  }

  if (!isRecord(choice) || !isNonEmptyString(choice.item)) {
    return { path: slot, message: "must be { item, style? } with a non-empty item" };
  }

  const item = findOutfitItem(choice.item);

  if (item === undefined) {
    return { path: `${slot}.item`, message: `"${choice.item}" is not in the catalogue` };
  }

  if (item.slot !== slot) {
    return { path: `${slot}.item`, message: `"${item.id}" is a ${item.slot} item` };
  }

  if (!isOutfitItemOnRail(item, genre)) {
    return { path: `${slot}.item`, message: `"${item.id}" is not on the ${genre} rail` };
  }

  if ("style" in choice && !(isOutfitStyle(choice.style) && item.styles.includes(choice.style))) {
    return { path: `${slot}.style`, message: `must be one of "${item.id}"'s styles (${item.styles.join(", ")})` };
  }

  return null;
};

/** Strict: every reason this value is not an outfit a bird of `genre` can wear. */
export const validateOutfit = (genre: GenreKey, value: unknown): ValidationIssue[] => {
  if (!isRecord(value)) {
    return [{ path: "", message: "must be an object" }];
  }

  return Object.entries(value).flatMap(([slot, choice]): ValidationIssue[] => {
    if (!isOutfitSlot(slot)) {
      return [{ path: slot, message: `is not a slot (${OUTFIT_SLOTS.join(", ")})` }];
    }

    const issue = refuseChoice(genre, slot, choice);

    return issue === null ? [] : [issue];
  });
};

/** Strict: the outfit as written, or null when any of it is refused. */
export const parseOutfit = (genre: GenreKey, value: unknown): Outfit | null => {
  if (validateOutfit(genre, value).length > 0) {
    return null;
  }

  return Object.fromEntries(
    Object.entries(value as Record<OutfitSlot, OutfitChoice>).map(([slot, choice]) => [
      slot,
      choice.style === undefined ? { item: choice.item } : { item: choice.item, style: choice.style }
    ])
  );
};

/**
 * Tolerant: the part of this value a bird of `genre` can wear, with every
 * choice's style made concrete (the item's default when it named none, or one
 * the item no longer offers). `onDrop` hears each choice left off, so the
 * loader can say so once at boot; the cast passes nothing and just draws.
 */
export const resolveWornOutfit = (
  genre: GenreKey,
  value: unknown,
  onDrop?: (issue: ValidationIssue) => void
): Outfit => {
  if (!isRecord(value)) {
    if (value !== undefined) {
      onDrop?.({ path: "", message: "must be an object" });
    }

    return {};
  }

  const worn: Outfit = {};

  for (const [slot, choice] of Object.entries(value)) {
    if (!isOutfitSlot(slot)) {
      onDrop?.({ path: slot, message: "is not a slot" });
      continue;
    }

    const issue = refuseChoice(genre, slot, choice);
    // A style the item no longer offers costs the style, not the item: the
    // guest still chose that vest, and it has a default.
    const styleOnly = issue !== null && issue.path === `${slot}.style`;

    if (issue !== null) {
      onDrop?.(issue);
    }

    if (issue !== null && !styleOnly) {
      continue;
    }

    const { item: id, style } = choice as OutfitChoice;
    const item = findOutfitItem(id) as OutfitItem;
    const wornStyle = !styleOnly && style !== undefined ? style : item.styles[0];

    worn[slot] = wornStyle === undefined ? { item: id } : { item: id, style: wornStyle };
  }

  return worn;
};

// The pack's shape, per choice: an item id and maybe a style. Membership is
// not checked here (see the top of the file).
const validateOutfitShape = (value: unknown): ValidationIssue[] => {
  if (!isRecord(value)) {
    return [{ path: "", message: "must be an object of slot -> { item, style? }" }];
  }

  return Object.entries(value).flatMap(([slot, choice]): ValidationIssue[] => {
    if (!isOutfitSlot(slot)) {
      return [{ path: slot, message: `is not a slot (${OUTFIT_SLOTS.join(", ")})` }];
    }

    if (!isRecord(choice) || !isNonEmptyString(choice.item)) {
      return [{ path: slot, message: "must be { item, style? } with a non-empty item" }];
    }

    if ("style" in choice && !isOutfitStyle(choice.style)) {
      return [{ path: `${slot}.style`, message: `must be one of ${OUTFIT_STYLES.join(", ")}` }];
    }

    return [];
  });
};

/** Strict on shape, for players.json's `outfits`: genre -> slot -> { item, style? }. */
export const validateOutfitsByGenre = (value: unknown): ValidationIssue[] => {
  if (!isRecord(value)) {
    return [{ path: "", message: "must be an object of genre -> outfit" }];
  }

  return Object.entries(value).flatMap(([genre, outfit]): ValidationIssue[] => {
    if (!isGenreKey(genre)) {
      return [{ path: genre, message: `is not a genre (${GENRE_KEYS.join(", ")})` }];
    }

    return prefixIssuePaths(validateOutfitShape(outfit), genre);
  });
};
