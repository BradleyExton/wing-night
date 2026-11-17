// The wardrobe's catalogue: every item a guest can dress their bird in, one
// entry per idea. Gate 1 (docs/bird-wardrobe-gate-1.md) kept up to three
// drawings of each; the 2026-11-16 collapse kept one, so the picker shows one
// tile per item. The art itself started in the harness, in
// `apps/client/public/mockups/cast/outfit-items/`, which still holds every
// variant; run 3 ported each kept one into the cast under the same id.
//
// An id is `<harness item>-<variant>`, and the letter says which drawing
// survived (`flying-v-b`). Ids are permanent. Cutting an item deletes its
// entry here, and the tolerant reader quietly undresses anyone still wearing it.
//
// `styles` is the drawing's own list, first the default. Gold never leads, and
// it is absent wherever Gate 1 found it failing (the bandolier, the pom-pom,
// the mirror-ball egg, every country item).
import type { OutfitItem, OutfitRail, OutfitSlot, OutfitStyle } from "../types.ts";

const item = (
  id: string,
  slot: OutfitSlot,
  genre: OutfitRail,
  name: string,
  styles: readonly OutfitStyle[]
): OutfitItem => ({ id, slot, genre, name, styles });

export const OUTFIT_ITEMS: readonly OutfitItem[] = [
  // metal-kit
  item("battle-vest-a", "top", "metal", "Battle vest", ["ink"]),
  item("bandolier-b", "top", "metal", "Bullet belt", ["ink"]),
  item("biker-jacket-a", "top", "metal", "Biker jacket", ["ink"]),
  item("leather-sleeve-a", "sleeve", "metal", "Leather sleeve", ["ink"]),
  item("flame-sleeve-b", "sleeve", "metal", "Flame sleeve", ["ink"]),
  item("chain-loop-b", "tail", "metal", "Chain loop", ["team"]),
  item("spiked-cuff-b", "tail", "metal", "Spiked cuff", ["team"]),
  item("lava-tips-b", "tail", "metal", "Lava tips", ["ink"]),
  item("combat-boots-a", "boots", "metal", "Combat boots", ["ink", "white"]),
  item("spiked-boots-a", "boots", "metal", "Spiked boots", ["team", "white"]),
  // metal-show
  item("flying-v-b", "prop", "metal", "Flying V", ["white", "gold"]),
  item("drumsticks-a", "prop", "metal", "Drumsticks", ["white", "gold"]),
  item("battle-axe-a", "prop", "metal", "Battle axe", ["white", "gold"]),
  item("lava-disc-c", "stage", "metal", "Lava disc", ["ink"]),
  item("bolt-disc-a", "stage", "metal", "Lightning bolts", ["ink"]),
  // pop-kit
  item("crop-jacket-b", "top", "pop", "Crop jacket", ["ink"]),
  item("tracksuit-top-b", "top", "pop", "Tracksuit top", ["ink"]),
  item("little-black-dress-b", "top", "pop", "Little black dress", ["ink"]),
  item("union-jack-dress-b", "top", "pop", "Union Jack dress", ["ink", "team"]),
  item("stripe-sleeve-b", "sleeve", "pop", "Tracksuit stripes", ["team", "ink"]),
  item("puff-sleeve-a", "sleeve", "pop", "Party sleeve", ["white"]),
  item("big-bow-b", "tail", "pop", "Big bow", ["white", "team", "gold"]),
  item("ribbon-streamers-b", "tail", "pop", "Ribbon streamers", ["white", "ink"]),
  item("platform-trainers-a", "boots", "pop", "Platform trainers", ["white", "team"]),
  item("go-go-boots-b", "boots", "pop", "Go-go boots", ["ink", "white"]),
  // pop-show
  item("star-mic-a", "prop", "pop", "Star mic", ["white", "gold"]),
  item("corded-mic-a", "prop", "pop", "Corded mic", ["white", "gold"]),
  item("pom-pom-a", "prop", "pop", "Pom-pom", ["white"]),
  item("union-jack-flag-c", "prop", "pop", "Union Jack flag", ["ink", "white"]),
  item("led-star-riser-a", "stage", "pop", "LED star riser", ["white", "gold"]),
  item("spotlight-b", "stage", "pop", "Spotlight", ["white", "team", "gold"]),
  // country-kit
  item("bandana-b", "top", "country", "Bandana", ["white", "ink"]),
  item("western-yoke-b", "top", "country", "Western yoke", ["ink"]),
  item("trophy-buckle-a", "top", "country", "Trophy buckle", ["white"]),
  item("fringed-vest-a", "top", "country", "Fringed vest", ["ink"]),
  item("fringe-sleeve-b", "sleeve", "country", "Fringe sleeve", ["ink"]),
  item("suede-sleeve-a", "sleeve", "country", "Suede sleeve", ["ink"]),
  item("tail-bandana-a", "tail", "country", "Tail bandana", ["white", "ink"]),
  item("rope-coil-a", "tail", "country", "Rope coil", ["ink", "white"]),
  // country-show
  item("lasso-b", "prop", "country", "Lasso", ["ink", "white"]),
  item("corn-cob-a", "prop", "country", "Corn cob", ["white"]),
  item("acoustic-guitar-a", "prop", "country", "Acoustic guitar", ["white"]),
  item("hay-bale-b", "stage", "country", "Hay bale", ["ink"]),
  item("sawdust-ring-a", "stage", "country", "Sawdust ring", ["ink", "team"]),
  // disco-kit
  item("open-shirt-b", "top", "disco", "Open shirt", ["ink"]),
  item("dagger-collar-b", "top", "disco", "Dagger collar", ["white", "gold"]),
  item("satin-jacket-a", "top", "disco", "Satin jacket", ["ink", "white"]),
  item("flare-sleeve-c", "sleeve", "disco", "Flare sleeve", ["white", "gold"]),
  item("satin-sleeve-b", "sleeve", "disco", "Satin sleeve", ["white", "gold"]),
  item("tinsel-a", "tail", "disco", "Tinsel", ["white", "gold"]),
  item("feather-boa-b", "tail", "disco", "Feather boa", ["white", "gold"]),
  item("platforms-a", "boots", "disco", "Platforms", ["white", "gold"]),
  item("roller-skates-a", "boots", "disco", "Roller skates", ["white", "ink"]),
  // disco-show
  item("mirror-ball-egg-c", "prop", "disco", "Mirror-ball egg", ["white"]),
  item("hand-fan-b", "prop", "disco", "Hand fan", ["ink", "white", "gold"]),
  item("vinyl-b", "prop", "disco", "Vinyl", ["team", "gold"]),
  item("lit-floor-a", "stage", "disco", "Lit floor", ["team"]),
  item("neon-flames-b", "stage", "disco", "Neon flames", ["team", "white"]),
  // shared
  item("wing-night-bib-b", "top", "shared", "Wing-night bib", ["white"]),
  item("team-sash-a", "top", "shared", "Team sash", ["white", "ink"]),
  item("golden-egg-b", "prop", "shared", "Golden egg", ["white", "gold"]),
  item("drumstick-b", "prop", "shared", "Drumstick", ["white", "team", "gold"]),
  item("egg-nest-a", "stage", "shared", "Egg nest", ["white", "gold"]),
  // Moves (outfit-moves.html): a pose, not a drawing, so one entry each and no
  // styles to pick between.
  item("horns-pump", "move", "metal", "Fist pump", []),
  item("double-headbang", "move", "metal", "Double headbang", []),
  item("heart-point", "move", "pop", "Point and swoon", []),
  item("sporty-hop", "move", "pop", "Sporty hop", []),
  item("boot-scoot", "move", "country", "Boot-scoot", []),
  item("yeehaw-buck", "move", "country", "Bronco buck", []),
  item("night-fever", "move", "disco", "Night Fever point", []),
  item("the-bump", "move", "disco", "The Bump", []),
  item("chicken-dance", "move", "shared", "The Chicken Dance", [])
];
