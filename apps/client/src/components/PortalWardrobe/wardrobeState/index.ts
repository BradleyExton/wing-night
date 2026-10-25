// What the wardrobe shows and does to an outfit, decided in one tested place
// (docs/research/bird-wardrobe.md §2.5): the line that says what the bird has
// on, the dice, one tap on a tile or a swatch, which Look the bird is wearing,
// and where each slot's tile crops the bird. The page holds the outfit; this
// module only reads and rebuilds it.
import {
  OUTFIT_LOOKS,
  OUTFIT_SHOWPIECE_SLOTS,
  OUTFIT_SLOTS,
  findOutfitItem,
  resolveOutfitRail,
  resolveOutfitSlots,
  resolveWornOutfit,
  type CharacterSilhouette,
  type GenreKey,
  type Outfit,
  type OutfitChoice,
  type OutfitItem,
  type OutfitLook,
  type OutfitSlot,
  type OutfitStyle,
  type OutfitsByGenre
} from "@wingnight/shared";

// A genre's Looks; a genre with no rail of its own has none and opens on the dice.
export const resolveOutfitLooks = (genre: GenreKey): readonly OutfitLook[] =>
  (OUTFIT_LOOKS as Partial<Record<GenreKey, readonly OutfitLook[]>>)[genre] ?? [];

// The outfit a guest has built for a genre, read the way the TV will draw it:
// an item cut since they chose it is gone, and every choice names its style.
export const resolveGenreOutfit = (outfitsByGenre: OutfitsByGenre | undefined, genre: GenreKey): Outfit =>
  resolveWornOutfit(genre, outfitsByGenre?.[genre]);

const BARE_LINE = "Bare. The silhouette's doing all the work.";

// A name mid-sentence: "Leather sleeve" is a common noun and drops its
// capital; "Flying V" and "The Chicken Dance" are names and keep theirs.
const toRunningText = (name: string): string =>
  /[A-Z]/.test(name.slice(1)) ? name : `${name.charAt(0).toLowerCase()}${name.slice(1)}`;

/** The one line that says what the bird has on: "Battle vest, leather sleeve and Flying V." */
export const resolveOutfitSummary = (outfit: Outfit): string => {
  const names = OUTFIT_SLOTS.flatMap((slot) => {
    const choice = outfit[slot];
    const item = choice === undefined ? undefined : findOutfitItem(choice.item);

    return item === undefined ? [] : [item.name];
  });

  if (names.length === 0) {
    return BARE_LINE;
  }

  const [first, ...rest] = names as [string, ...string[]];
  const running = [first, ...rest.map(toRunningText)];

  return running.length === 1
    ? `${first}.`
    : `${running.slice(0, -1).join(", ")} and ${running[running.length - 1] ?? ""}.`;
};

// The dice fills a slot this often, so the bird comes out dressed but not
// loaded (§2.5): a full kit plus a prop is the density limit, not the default.
export const DRESS_ME_FILL_CHANCE = 0.6;

/**
 * "Dress me": one item per slot from the genre's rail and the shared one, each
 * slot filled with DRESS_ME_FILL_CHANCE, in the item's default style. `random`
 * is `Math.random` on the page and a script in a test.
 */
export const resolveDressMeOutfit = (genre: GenreKey, random: () => number): Outfit => {
  const outfit: Outfit = {};

  for (const slot of resolveOutfitSlots(genre)) {
    const rail = resolveOutfitRail(genre, slot);

    if (rail.length === 0 || random() >= DRESS_ME_FILL_CHANCE) {
      continue;
    }

    const item = rail[Math.min(rail.length - 1, Math.floor(random() * rail.length))] as OutfitItem;

    outfit[slot] = toChoice(item, undefined);
  }

  return outfit;
};

const toChoice = (item: OutfitItem, style: OutfitStyle | undefined): OutfitChoice => {
  const worn = style !== undefined && item.styles.includes(style) ? style : item.styles[0];

  return worn === undefined ? { item: item.id } : { item: item.id, style: worn };
};

/**
 * One tile tapped: that item in the slot, in its default style — or, when it is
 * the item already on, unchanged, so a second tap never resets a style the
 * guest picked. `null` is the None tile, which takes the slot off.
 */
export const dressOutfitSlot = (outfit: Outfit, slot: OutfitSlot, itemId: string | null): Outfit => {
  const { [slot]: current, ...rest } = outfit;

  if (itemId === null) {
    return rest;
  }

  const item = findOutfitItem(itemId);

  if (item === undefined || item.slot !== slot) {
    return outfit;
  }

  return current?.item === itemId ? outfit : { ...rest, [slot]: toChoice(item, undefined) };
};

/** A swatch tapped: the slot's item, in that style, when the item offers it. */
export const restyleOutfitSlot = (outfit: Outfit, slot: OutfitSlot, style: OutfitStyle): Outfit => {
  const current = outfit[slot];
  const item = current === undefined ? undefined : findOutfitItem(current.item);

  return item === undefined || !item.styles.includes(style) ? outfit : { ...outfit, [slot]: toChoice(item, style) };
};

// Outfits compared as worn, so a Look written without the default style it
// leaves implicit still matches the same outfit read back with it.
const isSameWornOutfit = (genre: GenreKey, a: Outfit, b: Outfit): boolean => {
  const wornA = resolveWornOutfit(genre, a);
  const wornB = resolveWornOutfit(genre, b);
  const slots = new Set([...Object.keys(wornA), ...Object.keys(wornB)]) as Set<OutfitSlot>;

  return [...slots].every((slot) => wornA[slot]?.item === wornB[slot]?.item && wornA[slot]?.style === wornB[slot]?.style);
};

/** The Look the bird is wearing exactly, if any, so its button reads as on. */
export const resolveWornLookId = (genre: GenreKey, outfit: Outfit): string | null =>
  resolveOutfitLooks(genre).find((look) => isSameWornOutfit(genre, look.outfit, outfit))?.id ?? null;

/** The outfit as worn, read in the genre: what a Look or the dice put on, styles made concrete. */
export const resolveWornLookOutfit = (genre: GenreKey, look: OutfitLook): Outfit => resolveWornOutfit(genre, look.outfit);

// The bodies a tile is framed on: a genre's silhouette, or the stock bird
// (pop and every genre without a shape), whose three name-hashed bodies differ
// by a few units of belly and share one wing, tail and set of windows.
export type OutfitCropBody = CharacterSilhouette | "stock";

// Where a slot's tile looks, in the bird's own 80×72 box: the chest for the
// Top, the wing for the Sleeve, the tail, the feet for Boots, the wing and
// whatever it holds up for the Prop (§2.5: at 44px a whole bird shows
// nothing). Started from the picker mockup's (`mockups/cast/wardrobe-picker.html`)
// and fitted per body to the items as the cast draws them, measured in the
// browser on every silhouette: broody's tail hangs low and preener's stands
// straight up, so one window cut the first off and left the second half empty;
// and pop's rail holds props on both sides, up in the wing and out in front
// of the chest, so its Prop window is nearly the whole bird. Every window is
// square, like its tile: a wider one would letterbox, and the letterbox shows
// the bird around it. These tiles draw the bird without its head
// (`isOutfitCropWhole`), which is what lets a window reach as high as a Prop
// does. The Stage and the Move tiles show the whole bird, head and all, a
// Stage because it is the floor under all of it and a Move because it is all
// of it moving: theirs are one window for every body, with room for a photo
// head's hair and halo (and for most of a Move's travel; sporty-hop's apex
// still leaves the tile for a beat).
const WHOLE_BIRD_CROPS = {
  stage: "-9 -15 98 98",
  move: "-10 -22 100 100"
} as const;

export const OUTFIT_SLOT_CROPS: Record<OutfitCropBody, Record<OutfitSlot, string>> = {
  spiky: {
    top: "26 22 46 46",
    sleeve: "10 21 44 44",
    tail: "-13 0 54 54",
    boots: "20 44 36 36",
    prop: "6 6 62 62",
    ...WHOLE_BIRD_CROPS
  },
  broody: {
    top: "26 26 44 44",
    sleeve: "14 23 40 40",
    tail: "-12 26 40 40",
    boots: "20 44 36 36",
    prop: "-3 12 64 64",
    ...WHOLE_BIRD_CROPS
  },
  preener: {
    top: "24 16 46 46",
    sleeve: "8 21 44 44",
    tail: "-8 -3 48 48",
    boots: "20 44 36 36",
    prop: "-9 5 67 67",
    ...WHOLE_BIRD_CROPS
  },
  stock: {
    top: "26 22 48 48",
    sleeve: "14 22 42 42",
    tail: "-9 1 48 48",
    boots: "20 44 36 36",
    prop: "-4 2 78 78",
    ...WHOLE_BIRD_CROPS
  }
};

/** A slot's tile window on this body: `theme.silhouette`, undefined for the stock bird. */
export const resolveOutfitSlotCrop = (silhouette: CharacterSilhouette | undefined, slot: OutfitSlot): string =>
  OUTFIT_SLOT_CROPS[silhouette ?? "stock"][slot];

// Whether a slot's tile shows the whole bird (the Stage, the Move) or a crop of
// it. A crop draws the bird WITHOUT its head: the head is where a Prop is held
// up beside and a tail rises past, so a window framed on the item either takes
// in a slice of the guest's face, which is the one thing in a tile the eye goes
// to, or cuts the item to stay clear of it — a Flying V's headstock and the
// photo's cheek share the same few units on every body.
export const isOutfitCropWhole = (slot: OutfitSlot): boolean => slot in WHOLE_BIRD_CROPS;

// A Top or a Sleeve is judged on the bird without the Prop held across it, the
// way a game draws it (kit only); the showpiece slots' own tiles draw them.
export const isOutfitCropOnShow = (slot: OutfitSlot): boolean => (OUTFIT_SHOWPIECE_SLOTS as readonly OutfitSlot[]).includes(slot);
