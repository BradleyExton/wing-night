// The wardrobe's catalogue: every item a guest can dress their bird in, one
// entry per drawing that survived Gate 1 (docs/bird-wardrobe-gate-1.md). The
// art itself is the harness's, in `apps/client/public/mockups/cast/outfit-items/`;
// run 3 ports each one into the cast under the same id.
//
// An id is `<harness item>-<variant>`, because Gate 1 kept whole variants, not
// items: two kept solutions to one idea (battle-vest a and b) are two tiles in
// the picker, and a guest who wore one must keep wearing that one. Ids are
// permanent. Cutting an item deletes its entry here, and the tolerant reader
// quietly undresses anyone still wearing it.
//
// `styles` is the drawing's own list, first the default. Gold never leads, and
// it is absent wherever Gate 1 found it failing (the bandolier, the pom-pom,
// the mirror-ball egg, every country item).
import type { OutfitItem, OutfitRail, OutfitSlot, OutfitStyle } from "../types.js";

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
  item("battle-vest-b", "top", "metal", "Battle vest", ["ink"]),
  item("bandolier-b", "top", "metal", "Bullet belt", ["ink"]),
  item("biker-jacket-a", "top", "metal", "Biker jacket", ["ink"]),
  item("biker-jacket-b", "top", "metal", "Biker jacket", ["ink"]),
  item("leather-sleeve-a", "sleeve", "metal", "Leather sleeve", ["ink"]),
  item("leather-sleeve-b", "sleeve", "metal", "Leather sleeve", ["ink"]),
  item("flame-sleeve-a", "sleeve", "metal", "Flame sleeve", ["ink"]),
  item("flame-sleeve-b", "sleeve", "metal", "Flame sleeve", ["ink"]),
  item("chain-loop-b", "tail", "metal", "Chain loop", ["team"]),
  item("spiked-cuff-b", "tail", "metal", "Spiked cuff", ["team"]),
  item("lava-tips-a", "tail", "metal", "Lava tips", ["ink"]),
  item("lava-tips-b", "tail", "metal", "Lava tips", ["ink"]),
  item("combat-boots-a", "boots", "metal", "Combat boots", ["ink", "white"]),
  item("combat-boots-b", "boots", "metal", "Combat boots", ["ink", "white"]),
  item("combat-boots-c", "boots", "metal", "Combat boots", ["ink"]),
  item("spiked-boots-a", "boots", "metal", "Spiked boots", ["team", "white"]),
  // metal-show
  item("flying-v-a", "prop", "metal", "Flying V", ["white", "gold"]),
  item("flying-v-b", "prop", "metal", "Flying V", ["white", "gold"]),
  item("flying-v-c", "prop", "metal", "Flying V", ["white", "gold"]),
  item("drumsticks-a", "prop", "metal", "Drumsticks", ["white", "gold"]),
  item("battle-axe-a", "prop", "metal", "Battle axe", ["white", "gold"]),
  item("battle-axe-b", "prop", "metal", "Battle axe", ["white", "gold"]),
  item("lava-disc-a", "stage", "metal", "Lava disc", ["ink"]),
  item("lava-disc-b", "stage", "metal", "Lava disc", ["ink"]),
  item("lava-disc-c", "stage", "metal", "Lava disc", ["ink"]),
  item("bolt-disc-a", "stage", "metal", "Lightning bolts", ["ink"]),
  item("bolt-disc-b", "stage", "metal", "Lightning bolts", ["ink"]),
  // pop-kit
  item("crop-jacket-a", "top", "pop", "Crop jacket", ["white"]),
  item("crop-jacket-b", "top", "pop", "Crop jacket", ["ink"]),
  item("tracksuit-top-a", "top", "pop", "Tracksuit top", ["ink", "white"]),
  item("tracksuit-top-b", "top", "pop", "Tracksuit top", ["ink"]),
  item("little-black-dress-a", "top", "pop", "Little black dress", ["ink"]),
  item("little-black-dress-b", "top", "pop", "Little black dress", ["ink"]),
  item("union-jack-dress-a", "top", "pop", "Union Jack dress", ["ink"]),
  item("union-jack-dress-b", "top", "pop", "Union Jack dress", ["ink", "team"]),
  item("stripe-sleeve-a", "sleeve", "pop", "Tracksuit stripes", ["team", "ink"]),
  item("stripe-sleeve-b", "sleeve", "pop", "Tracksuit stripes", ["team", "ink"]),
  item("puff-sleeve-a", "sleeve", "pop", "Party sleeve", ["white"]),
  item("puff-sleeve-b", "sleeve", "pop", "Party sleeve", ["team", "white"]),
  item("big-bow-a", "tail", "pop", "Big bow", ["white", "team", "gold"]),
  item("big-bow-b", "tail", "pop", "Big bow", ["white", "team", "gold"]),
  item("ribbon-streamers-a", "tail", "pop", "Ribbon streamers", ["white", "ink"]),
  item("ribbon-streamers-b", "tail", "pop", "Ribbon streamers", ["white", "ink"]),
  item("platform-trainers-a", "boots", "pop", "Platform trainers", ["white", "team"]),
  item("platform-trainers-b", "boots", "pop", "Platform trainers", ["white", "team"]),
  item("go-go-boots-a", "boots", "pop", "Go-go boots", ["white", "ink"]),
  item("go-go-boots-b", "boots", "pop", "Go-go boots", ["ink", "white"]),
  // pop-show
  item("star-mic-a", "prop", "pop", "Star mic", ["white", "gold"]),
  item("star-mic-b", "prop", "pop", "Star mic", ["white", "gold"]),
  item("star-mic-c", "prop", "pop", "Star mic", ["white", "gold"]),
  item("corded-mic-a", "prop", "pop", "Corded mic", ["white", "gold"]),
  item("corded-mic-b", "prop", "pop", "Corded mic", ["white", "gold"]),
  item("pom-pom-a", "prop", "pop", "Pom-pom", ["white"]),
  item("pom-pom-b", "prop", "pop", "Pom-pom", ["white"]),
  item("pom-pom-c", "prop", "pop", "Pom-pom", ["white"]),
  item("union-jack-flag-a", "prop", "pop", "Union Jack flag", ["ink", "white"]),
  item("union-jack-flag-b", "prop", "pop", "Union Jack flag", ["ink", "white"]),
  item("union-jack-flag-c", "prop", "pop", "Union Jack flag", ["ink", "white"]),
  item("led-star-riser-a", "stage", "pop", "LED star riser", ["white", "gold"]),
  item("led-star-riser-b", "stage", "pop", "LED star riser", ["white", "gold"]),
  item("led-star-riser-c", "stage", "pop", "LED star riser", ["white", "gold"]),
  item("spotlight-a", "stage", "pop", "Spotlight", ["white", "team", "gold"]),
  item("spotlight-b", "stage", "pop", "Spotlight", ["white", "team", "gold"]),
  // country-kit
  item("bandana-a", "top", "country", "Bandana", ["white", "ink"]),
  item("bandana-b", "top", "country", "Bandana", ["white", "ink"]),
  item("western-yoke-a", "top", "country", "Western yoke", ["ink", "white"]),
  item("western-yoke-b", "top", "country", "Western yoke", ["ink"]),
  item("trophy-buckle-a", "top", "country", "Trophy buckle", ["white"]),
  item("trophy-buckle-b", "top", "country", "Trophy buckle", ["white"]),
  item("fringed-vest-a", "top", "country", "Fringed vest", ["ink"]),
  item("fringed-vest-b", "top", "country", "Fringed vest", ["ink"]),
  item("fringe-sleeve-a", "sleeve", "country", "Fringe sleeve", ["team"]),
  item("fringe-sleeve-b", "sleeve", "country", "Fringe sleeve", ["ink"]),
  item("suede-sleeve-a", "sleeve", "country", "Suede sleeve", ["ink"]),
  item("suede-sleeve-b", "sleeve", "country", "Suede sleeve", ["ink"]),
  item("tail-bandana-a", "tail", "country", "Tail bandana", ["white", "ink"]),
  item("tail-bandana-b", "tail", "country", "Tail bandana", ["white", "ink"]),
  item("rope-coil-a", "tail", "country", "Rope coil", ["ink", "white"]),
  item("rope-coil-b", "tail", "country", "Rope coil", ["ink", "white"]),
  // country-show
  item("lasso-b", "prop", "country", "Lasso", ["ink", "white"]),
  item("lasso-c", "prop", "country", "Lasso", ["ink", "white"]),
  item("corn-cob-a", "prop", "country", "Corn cob", ["white"]),
  item("corn-cob-c", "prop", "country", "Corn cob", ["white"]),
  item("acoustic-guitar-a", "prop", "country", "Acoustic guitar", ["white"]),
  item("acoustic-guitar-b", "prop", "country", "Acoustic guitar", ["white"]),
  item("hay-bale-b", "stage", "country", "Hay bale", ["ink"]),
  item("sawdust-ring-a", "stage", "country", "Sawdust ring", ["ink", "team"]),
  item("sawdust-ring-b", "stage", "country", "Sawdust ring", ["ink", "team"]),
  item("sawdust-ring-c", "stage", "country", "Sawdust ring", ["ink", "team"]),
  // disco-kit
  item("open-shirt-b", "top", "disco", "Open shirt", ["ink"]),
  item("open-shirt-c", "top", "disco", "Open shirt", ["ink"]),
  item("dagger-collar-b", "top", "disco", "Dagger collar", ["white", "gold"]),
  item("satin-jacket-a", "top", "disco", "Satin jacket", ["ink", "white"]),
  item("flare-sleeve-b", "sleeve", "disco", "Flare sleeve", ["ink", "team"]),
  item("flare-sleeve-c", "sleeve", "disco", "Flare sleeve", ["white", "gold"]),
  item("satin-sleeve-a", "sleeve", "disco", "Satin sleeve", ["white", "gold"]),
  item("satin-sleeve-b", "sleeve", "disco", "Satin sleeve", ["white", "gold"]),
  item("tinsel-a", "tail", "disco", "Tinsel", ["white", "gold"]),
  item("feather-boa-a", "tail", "disco", "Feather boa", ["white", "gold"]),
  item("feather-boa-b", "tail", "disco", "Feather boa", ["white", "gold"]),
  item("platforms-a", "boots", "disco", "Platforms", ["white", "gold"]),
  item("roller-skates-a", "boots", "disco", "Roller skates", ["white", "ink"]),
  item("roller-skates-b", "boots", "disco", "Roller skates", ["white", "ink"]),
  // disco-show
  item("mirror-ball-egg-a", "prop", "disco", "Mirror-ball egg", ["white"]),
  item("mirror-ball-egg-c", "prop", "disco", "Mirror-ball egg", ["white"]),
  item("hand-fan-b", "prop", "disco", "Hand fan", ["ink", "white", "gold"]),
  item("vinyl-b", "prop", "disco", "Vinyl", ["team", "gold"]),
  item("lit-floor-a", "stage", "disco", "Lit floor", ["team"]),
  item("lit-floor-b", "stage", "disco", "Lit floor", ["team"]),
  item("neon-flames-a", "stage", "disco", "Neon flames", ["team", "white"]),
  item("neon-flames-b", "stage", "disco", "Neon flames", ["team", "white"]),
  // shared
  item("wing-night-bib-a", "top", "shared", "Wing-night bib", ["ink"]),
  item("wing-night-bib-b", "top", "shared", "Wing-night bib", ["white"]),
  item("team-sash-a", "top", "shared", "Team sash", ["white", "ink"]),
  item("team-sash-b", "top", "shared", "Team sash", ["white", "ink"]),
  item("golden-egg-a", "prop", "shared", "Golden egg", ["white", "gold"]),
  item("golden-egg-b", "prop", "shared", "Golden egg", ["white", "gold"]),
  item("drumstick-a", "prop", "shared", "Drumstick", ["team", "ink", "gold"]),
  item("drumstick-b", "prop", "shared", "Drumstick", ["white", "team", "gold"]),
  item("egg-nest-a", "stage", "shared", "Egg nest", ["white", "gold"]),
  item("egg-nest-b", "stage", "shared", "Egg nest", ["white", "gold"]),
  item("egg-nest-c", "stage", "shared", "Egg nest", ["white", "gold"]),
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
