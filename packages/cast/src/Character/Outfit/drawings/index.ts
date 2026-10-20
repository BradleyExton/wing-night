import type { OutfitDrawing } from "../context/index.js";
import { CombatBootsA } from "../boots/CombatBootsA/index.js";
import { CombatBootsB } from "../boots/CombatBootsB/index.js";
import { CombatBootsC } from "../boots/CombatBootsC/index.js";
import { SpikedBootsA } from "../boots/SpikedBootsA/index.js";
import { BattleAxeA } from "../prop/BattleAxeA/index.js";
import { BattleAxeB } from "../prop/BattleAxeB/index.js";
import { DrumsticksA } from "../prop/DrumsticksA/index.js";
import { FlyingVA } from "../prop/FlyingVA/index.js";
import { FlyingVB } from "../prop/FlyingVB/index.js";
import { FlyingVC } from "../prop/FlyingVC/index.js";
import { FlameSleeveA } from "../sleeve/FlameSleeveA/index.js";
import { FlameSleeveB } from "../sleeve/FlameSleeveB/index.js";
import { LeatherSleeveA } from "../sleeve/LeatherSleeveA/index.js";
import { LeatherSleeveB } from "../sleeve/LeatherSleeveB/index.js";
import { BoltDiscA } from "../stage/BoltDiscA/index.js";
import { BoltDiscB } from "../stage/BoltDiscB/index.js";
import { LavaDiscA } from "../stage/LavaDiscA/index.js";
import { LavaDiscB } from "../stage/LavaDiscB/index.js";
import { LavaDiscC } from "../stage/LavaDiscC/index.js";
import { ChainLoopB } from "../tail/ChainLoopB/index.js";
import { LavaTipsA } from "../tail/LavaTipsA/index.js";
import { LavaTipsB } from "../tail/LavaTipsB/index.js";
import { SpikedCuffB } from "../tail/SpikedCuffB/index.js";
import { BandolierB } from "../top/BandolierB/index.js";
import { BattleVestA } from "../top/BattleVestA/index.js";
import { BattleVestB } from "../top/BattleVestB/index.js";
import { BikerJacketA } from "../top/BikerJacketA/index.js";
import { BikerJacketB } from "../top/BikerJacketB/index.js";

// Every item the cast can draw, by its catalogue id (`OUTFIT_ITEMS`). An item
// the catalogue lists and this does not is simply not drawn — the bird wears
// the rest — which is what lets the catalogue run ahead of the port.
//
// Run 2 ported one finished item per slot, all from the metal rail so one bird
// in the sample pack can wear the lot; run 3 ports every other kept item, each
// pixel-checked against its harness drawing, until a test requiring a drawing
// for every catalogue item passes.
export const OUTFIT_DRAWINGS: Readonly<Partial<Record<string, OutfitDrawing>>> = {
  // metal-kit
  "battle-vest-a": { slot: "top", Drawing: BattleVestA },
  "battle-vest-b": { slot: "top", Drawing: BattleVestB },
  "bandolier-b": { slot: "top", Drawing: BandolierB },
  "biker-jacket-a": { slot: "top", Drawing: BikerJacketA },
  "biker-jacket-b": { slot: "top", Drawing: BikerJacketB },
  "leather-sleeve-a": { slot: "sleeve", Drawing: LeatherSleeveA },
  "leather-sleeve-b": { slot: "sleeve", Drawing: LeatherSleeveB },
  "flame-sleeve-a": { slot: "sleeve", Drawing: FlameSleeveA },
  "flame-sleeve-b": { slot: "sleeve", Drawing: FlameSleeveB },
  "chain-loop-b": { slot: "tail", Drawing: ChainLoopB },
  "spiked-cuff-b": { slot: "tail", Drawing: SpikedCuffB },
  "lava-tips-a": { slot: "tail", Drawing: LavaTipsA },
  "lava-tips-b": { slot: "tail", Drawing: LavaTipsB },
  "combat-boots-a": { slot: "boots", Drawing: CombatBootsA },
  "combat-boots-b": { slot: "boots", Drawing: CombatBootsB },
  "combat-boots-c": { slot: "boots", Drawing: CombatBootsC },
  "spiked-boots-a": { slot: "boots", Drawing: SpikedBootsA },
  // metal-show
  "flying-v-a": { slot: "prop", Drawing: FlyingVA },
  "flying-v-b": { slot: "prop", Drawing: FlyingVB },
  "flying-v-c": { slot: "prop", Drawing: FlyingVC },
  "drumsticks-a": { slot: "prop", Drawing: DrumsticksA },
  "battle-axe-a": { slot: "prop", Drawing: BattleAxeA },
  "battle-axe-b": { slot: "prop", Drawing: BattleAxeB },
  "lava-disc-a": { slot: "stage", Drawing: LavaDiscA },
  "lava-disc-b": { slot: "stage", Drawing: LavaDiscB },
  "lava-disc-c": { slot: "stage", Drawing: LavaDiscC },
  "bolt-disc-a": { slot: "stage", Drawing: BoltDiscA },
  "bolt-disc-b": { slot: "stage", Drawing: BoltDiscB }
};
