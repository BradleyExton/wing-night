import type { OutfitDrawing } from "../context/index.js";
import { CombatBootsA } from "../boots/CombatBootsA/index.js";
import { CombatBootsB } from "../boots/CombatBootsB/index.js";
import { CombatBootsC } from "../boots/CombatBootsC/index.js";
import { GoGoBootsA } from "../boots/GoGoBootsA/index.js";
import { GoGoBootsB } from "../boots/GoGoBootsB/index.js";
import { PlatformTrainersA } from "../boots/PlatformTrainersA/index.js";
import { PlatformTrainersB } from "../boots/PlatformTrainersB/index.js";
import { SpikedBootsA } from "../boots/SpikedBootsA/index.js";
import { BattleAxeA } from "../prop/BattleAxeA/index.js";
import { BattleAxeB } from "../prop/BattleAxeB/index.js";
import { CordedMicA } from "../prop/CordedMicA/index.js";
import { CordedMicB } from "../prop/CordedMicB/index.js";
import { DrumsticksA } from "../prop/DrumsticksA/index.js";
import { FlyingVA } from "../prop/FlyingVA/index.js";
import { FlyingVB } from "../prop/FlyingVB/index.js";
import { FlyingVC } from "../prop/FlyingVC/index.js";
import { PomPomA } from "../prop/PomPomA/index.js";
import { PomPomB } from "../prop/PomPomB/index.js";
import { PomPomC } from "../prop/PomPomC/index.js";
import { StarMicA } from "../prop/StarMicA/index.js";
import { StarMicB } from "../prop/StarMicB/index.js";
import { StarMicC } from "../prop/StarMicC/index.js";
import { UnionJackFlagA } from "../prop/UnionJackFlagA/index.js";
import { UnionJackFlagB } from "../prop/UnionJackFlagB/index.js";
import { UnionJackFlagC } from "../prop/UnionJackFlagC/index.js";
import { FlameSleeveA } from "../sleeve/FlameSleeveA/index.js";
import { FlameSleeveB } from "../sleeve/FlameSleeveB/index.js";
import { LeatherSleeveA } from "../sleeve/LeatherSleeveA/index.js";
import { LeatherSleeveB } from "../sleeve/LeatherSleeveB/index.js";
import { PuffSleeveA } from "../sleeve/PuffSleeveA/index.js";
import { PuffSleeveB } from "../sleeve/PuffSleeveB/index.js";
import { StripeSleeveA } from "../sleeve/StripeSleeveA/index.js";
import { StripeSleeveB } from "../sleeve/StripeSleeveB/index.js";
import { BoltDiscA } from "../stage/BoltDiscA/index.js";
import { BoltDiscB } from "../stage/BoltDiscB/index.js";
import { LavaDiscA } from "../stage/LavaDiscA/index.js";
import { LavaDiscB } from "../stage/LavaDiscB/index.js";
import { LavaDiscC } from "../stage/LavaDiscC/index.js";
import { LedStarRiserA } from "../stage/LedStarRiserA/index.js";
import { LedStarRiserB } from "../stage/LedStarRiserB/index.js";
import { LedStarRiserC } from "../stage/LedStarRiserC/index.js";
import { SpotlightA } from "../stage/SpotlightA/index.js";
import { SpotlightB } from "../stage/SpotlightB/index.js";
import { BigBowA } from "../tail/BigBowA/index.js";
import { BigBowB } from "../tail/BigBowB/index.js";
import { ChainLoopB } from "../tail/ChainLoopB/index.js";
import { LavaTipsA } from "../tail/LavaTipsA/index.js";
import { LavaTipsB } from "../tail/LavaTipsB/index.js";
import { RibbonStreamersA } from "../tail/RibbonStreamersA/index.js";
import { RibbonStreamersB } from "../tail/RibbonStreamersB/index.js";
import { SpikedCuffB } from "../tail/SpikedCuffB/index.js";
import { BandolierB } from "../top/BandolierB/index.js";
import { BattleVestA } from "../top/BattleVestA/index.js";
import { BattleVestB } from "../top/BattleVestB/index.js";
import { BikerJacketA } from "../top/BikerJacketA/index.js";
import { BikerJacketB } from "../top/BikerJacketB/index.js";
import { CropJacketA } from "../top/CropJacketA/index.js";
import { CropJacketB } from "../top/CropJacketB/index.js";
import { LittleBlackDressA } from "../top/LittleBlackDressA/index.js";
import { LittleBlackDressB } from "../top/LittleBlackDressB/index.js";
import { TracksuitTopA } from "../top/TracksuitTopA/index.js";
import { TracksuitTopB } from "../top/TracksuitTopB/index.js";
import { UnionJackDressA } from "../top/UnionJackDressA/index.js";
import { UnionJackDressB } from "../top/UnionJackDressB/index.js";

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
  "bolt-disc-b": { slot: "stage", Drawing: BoltDiscB },
  // pop-kit
  "crop-jacket-a": { slot: "top", Drawing: CropJacketA },
  "crop-jacket-b": { slot: "top", Drawing: CropJacketB },
  "tracksuit-top-a": { slot: "top", Drawing: TracksuitTopA },
  "tracksuit-top-b": { slot: "top", Drawing: TracksuitTopB },
  "little-black-dress-a": { slot: "top", Drawing: LittleBlackDressA },
  "little-black-dress-b": { slot: "top", Drawing: LittleBlackDressB },
  "union-jack-dress-a": { slot: "top", Drawing: UnionJackDressA },
  "union-jack-dress-b": { slot: "top", Drawing: UnionJackDressB },
  "stripe-sleeve-a": { slot: "sleeve", Drawing: StripeSleeveA },
  "stripe-sleeve-b": { slot: "sleeve", Drawing: StripeSleeveB },
  "puff-sleeve-a": { slot: "sleeve", Drawing: PuffSleeveA },
  "puff-sleeve-b": { slot: "sleeve", Drawing: PuffSleeveB },
  "big-bow-a": { slot: "tail", Drawing: BigBowA },
  "big-bow-b": { slot: "tail", Drawing: BigBowB },
  "ribbon-streamers-a": { slot: "tail", Drawing: RibbonStreamersA },
  "ribbon-streamers-b": { slot: "tail", Drawing: RibbonStreamersB },
  "platform-trainers-a": { slot: "boots", Drawing: PlatformTrainersA },
  "platform-trainers-b": { slot: "boots", Drawing: PlatformTrainersB },
  "go-go-boots-a": { slot: "boots", Drawing: GoGoBootsA },
  "go-go-boots-b": { slot: "boots", Drawing: GoGoBootsB },
  // pop-show
  "star-mic-a": { slot: "prop", Drawing: StarMicA },
  "star-mic-b": { slot: "prop", Drawing: StarMicB },
  "star-mic-c": { slot: "prop", Drawing: StarMicC },
  "corded-mic-a": { slot: "prop", Drawing: CordedMicA },
  "corded-mic-b": { slot: "prop", Drawing: CordedMicB },
  "pom-pom-a": { slot: "prop", Drawing: PomPomA },
  "pom-pom-b": { slot: "prop", Drawing: PomPomB },
  "pom-pom-c": { slot: "prop", Drawing: PomPomC },
  "union-jack-flag-a": { slot: "prop", Drawing: UnionJackFlagA },
  "union-jack-flag-b": { slot: "prop", Drawing: UnionJackFlagB },
  "union-jack-flag-c": { slot: "prop", Drawing: UnionJackFlagC },
  "led-star-riser-a": { slot: "stage", Drawing: LedStarRiserA },
  "led-star-riser-b": { slot: "stage", Drawing: LedStarRiserB },
  "led-star-riser-c": { slot: "stage", Drawing: LedStarRiserC },
  "spotlight-a": { slot: "stage", Drawing: SpotlightA },
  "spotlight-b": { slot: "stage", Drawing: SpotlightB }
};
