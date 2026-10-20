import type { OutfitDrawing } from "../context/index.js";
import { CombatBootsA } from "../boots/CombatBootsA/index.js";
import { FlyingVA } from "../prop/FlyingVA/index.js";
import { FlameSleeveA } from "../sleeve/FlameSleeveA/index.js";
import { LavaDiscA } from "../stage/LavaDiscA/index.js";
import { ChainLoopB } from "../tail/ChainLoopB/index.js";
import { BattleVestA } from "../top/BattleVestA/index.js";

// Every item the cast can draw, by its catalogue id (`OUTFIT_ITEMS`). An item
// the catalogue lists and this does not is simply not drawn — the bird wears
// the rest — which is what lets the catalogue run ahead of the port.
//
// Run 2 ported one finished item per slot, all from the metal rail so one bird
// in the sample pack can wear the lot; run 3 ports every other kept item, each
// pixel-checked against its harness drawing, until a test requiring a drawing
// for every catalogue item passes.
export const OUTFIT_DRAWINGS: Readonly<Partial<Record<string, OutfitDrawing>>> = {
  "battle-vest-a": { slot: "top", Drawing: BattleVestA },
  "flame-sleeve-a": { slot: "sleeve", Drawing: FlameSleeveA },
  "chain-loop-b": { slot: "tail", Drawing: ChainLoopB },
  "combat-boots-a": { slot: "boots", Drawing: CombatBootsA },
  "flying-v-a": { slot: "prop", Drawing: FlyingVA },
  "lava-disc-a": { slot: "stage", Drawing: LavaDiscA }
};
