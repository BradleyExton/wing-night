import type { OutfitDrawing } from "../context/index.js";
import { CombatBootsA } from "../boots/CombatBootsA/index.js";
import { GoGoBootsB } from "../boots/GoGoBootsB/index.js";
import { PlatformTrainersA } from "../boots/PlatformTrainersA/index.js";
import { PlatformsA } from "../boots/PlatformsA/index.js";
import { RollerSkatesA } from "../boots/RollerSkatesA/index.js";
import { SpikedBootsA } from "../boots/SpikedBootsA/index.js";
import { AcousticGuitarA } from "../prop/AcousticGuitarA/index.js";
import { BattleAxeA } from "../prop/BattleAxeA/index.js";
import { CordedMicA } from "../prop/CordedMicA/index.js";
import { CornCobA } from "../prop/CornCobA/index.js";
import { DrumstickB } from "../prop/DrumstickB/index.js";
import { DrumsticksA } from "../prop/DrumsticksA/index.js";
import { FlyingVB } from "../prop/FlyingVB/index.js";
import { GoldenEggB } from "../prop/GoldenEggB/index.js";
import { HandFanB } from "../prop/HandFanB/index.js";
import { LassoB } from "../prop/LassoB/index.js";
import { MirrorBallEggC } from "../prop/MirrorBallEggC/index.js";
import { PomPomA } from "../prop/PomPomA/index.js";
import { StarMicA } from "../prop/StarMicA/index.js";
import { UnionJackFlagC } from "../prop/UnionJackFlagC/index.js";
import { VinylB } from "../prop/VinylB/index.js";
import { FlameSleeveB } from "../sleeve/FlameSleeveB/index.js";
import { FlareSleeveC } from "../sleeve/FlareSleeveC/index.js";
import { FringeSleeveB } from "../sleeve/FringeSleeveB/index.js";
import { LeatherSleeveA } from "../sleeve/LeatherSleeveA/index.js";
import { PuffSleeveA } from "../sleeve/PuffSleeveA/index.js";
import { SatinSleeveB } from "../sleeve/SatinSleeveB/index.js";
import { StripeSleeveB } from "../sleeve/StripeSleeveB/index.js";
import { SuedeSleeveA } from "../sleeve/SuedeSleeveA/index.js";
import { BoltDiscA } from "../stage/BoltDiscA/index.js";
import { EggNestA } from "../stage/EggNestA/index.js";
import { HayBaleB } from "../stage/HayBaleB/index.js";
import { LavaDiscC } from "../stage/LavaDiscC/index.js";
import { LedStarRiserA } from "../stage/LedStarRiserA/index.js";
import { LitFloorA } from "../stage/LitFloorA/index.js";
import { NeonFlamesB } from "../stage/NeonFlamesB/index.js";
import { SawdustRingA } from "../stage/SawdustRingA/index.js";
import { SpotlightB } from "../stage/SpotlightB/index.js";
import { BigBowB } from "../tail/BigBowB/index.js";
import { ChainLoopB } from "../tail/ChainLoopB/index.js";
import { FeatherBoaB } from "../tail/FeatherBoaB/index.js";
import { LavaTipsB } from "../tail/LavaTipsB/index.js";
import { RibbonStreamersB } from "../tail/RibbonStreamersB/index.js";
import { RopeCoilA } from "../tail/RopeCoilA/index.js";
import { SpikedCuffB } from "../tail/SpikedCuffB/index.js";
import { TailBandanaA } from "../tail/TailBandanaA/index.js";
import { TinselA } from "../tail/TinselA/index.js";
import { BandanaB } from "../top/BandanaB/index.js";
import { BandolierB } from "../top/BandolierB/index.js";
import { BattleVestA } from "../top/BattleVestA/index.js";
import { BikerJacketA } from "../top/BikerJacketA/index.js";
import { CropJacketB } from "../top/CropJacketB/index.js";
import { DaggerCollarB } from "../top/DaggerCollarB/index.js";
import { FringedVestA } from "../top/FringedVestA/index.js";
import { LittleBlackDressB } from "../top/LittleBlackDressB/index.js";
import { OpenShirtB } from "../top/OpenShirtB/index.js";
import { SatinJacketA } from "../top/SatinJacketA/index.js";
import { TeamSashA } from "../top/TeamSashA/index.js";
import { TracksuitTopB } from "../top/TracksuitTopB/index.js";
import { TrophyBuckleA } from "../top/TrophyBuckleA/index.js";
import { UnionJackDressB } from "../top/UnionJackDressB/index.js";
import { WesternYokeB } from "../top/WesternYokeB/index.js";
import { WingNightBibB } from "../top/WingNightBibB/index.js";

// Every item the cast can draw, by its catalogue id (`OUTFIT_ITEMS`), in the
// catalogue's order, rail by rail. Each is equal path for path to its harness
// drawing (run 3). A test holds the two lists in step; an id with no entry
// here (a hand-edited pack) is simply not drawn, and the bird wears the rest.
export const OUTFIT_DRAWINGS: Readonly<Partial<Record<string, OutfitDrawing>>> = {
  // metal-kit
  "battle-vest-a": { slot: "top", Drawing: BattleVestA },
  "bandolier-b": { slot: "top", Drawing: BandolierB },
  "biker-jacket-a": { slot: "top", Drawing: BikerJacketA },
  "leather-sleeve-a": { slot: "sleeve", Drawing: LeatherSleeveA },
  "flame-sleeve-b": { slot: "sleeve", Drawing: FlameSleeveB },
  "chain-loop-b": { slot: "tail", Drawing: ChainLoopB },
  "spiked-cuff-b": { slot: "tail", Drawing: SpikedCuffB },
  "lava-tips-b": { slot: "tail", Drawing: LavaTipsB },
  "combat-boots-a": { slot: "boots", Drawing: CombatBootsA },
  "spiked-boots-a": { slot: "boots", Drawing: SpikedBootsA },
  // metal-show
  "flying-v-b": { slot: "prop", Drawing: FlyingVB },
  "drumsticks-a": { slot: "prop", Drawing: DrumsticksA },
  "battle-axe-a": { slot: "prop", Drawing: BattleAxeA },
  "lava-disc-c": { slot: "stage", Drawing: LavaDiscC },
  "bolt-disc-a": { slot: "stage", Drawing: BoltDiscA },
  // pop-kit
  "crop-jacket-b": { slot: "top", Drawing: CropJacketB },
  "tracksuit-top-b": { slot: "top", Drawing: TracksuitTopB },
  "little-black-dress-b": { slot: "top", Drawing: LittleBlackDressB },
  "union-jack-dress-b": { slot: "top", Drawing: UnionJackDressB },
  "stripe-sleeve-b": { slot: "sleeve", Drawing: StripeSleeveB },
  "puff-sleeve-a": { slot: "sleeve", Drawing: PuffSleeveA },
  "big-bow-b": { slot: "tail", Drawing: BigBowB },
  "ribbon-streamers-b": { slot: "tail", Drawing: RibbonStreamersB },
  "platform-trainers-a": { slot: "boots", Drawing: PlatformTrainersA },
  "go-go-boots-b": { slot: "boots", Drawing: GoGoBootsB },
  // pop-show
  "star-mic-a": { slot: "prop", Drawing: StarMicA },
  "corded-mic-a": { slot: "prop", Drawing: CordedMicA },
  "pom-pom-a": { slot: "prop", Drawing: PomPomA },
  "union-jack-flag-c": { slot: "prop", Drawing: UnionJackFlagC },
  "led-star-riser-a": { slot: "stage", Drawing: LedStarRiserA },
  "spotlight-b": { slot: "stage", Drawing: SpotlightB },
  // country-kit
  "bandana-b": { slot: "top", Drawing: BandanaB },
  "western-yoke-b": { slot: "top", Drawing: WesternYokeB },
  "trophy-buckle-a": { slot: "top", Drawing: TrophyBuckleA },
  "fringed-vest-a": { slot: "top", Drawing: FringedVestA },
  "fringe-sleeve-b": { slot: "sleeve", Drawing: FringeSleeveB },
  "suede-sleeve-a": { slot: "sleeve", Drawing: SuedeSleeveA },
  "tail-bandana-a": { slot: "tail", Drawing: TailBandanaA },
  "rope-coil-a": { slot: "tail", Drawing: RopeCoilA },
  // country-show
  "lasso-b": { slot: "prop", Drawing: LassoB },
  "corn-cob-a": { slot: "prop", Drawing: CornCobA },
  "acoustic-guitar-a": { slot: "prop", Drawing: AcousticGuitarA },
  "hay-bale-b": { slot: "stage", Drawing: HayBaleB },
  "sawdust-ring-a": { slot: "stage", Drawing: SawdustRingA },
  // disco-kit
  "open-shirt-b": { slot: "top", Drawing: OpenShirtB },
  "dagger-collar-b": { slot: "top", Drawing: DaggerCollarB },
  "satin-jacket-a": { slot: "top", Drawing: SatinJacketA },
  "flare-sleeve-c": { slot: "sleeve", Drawing: FlareSleeveC },
  "satin-sleeve-b": { slot: "sleeve", Drawing: SatinSleeveB },
  "tinsel-a": { slot: "tail", Drawing: TinselA },
  "feather-boa-b": { slot: "tail", Drawing: FeatherBoaB },
  "platforms-a": { slot: "boots", Drawing: PlatformsA },
  "roller-skates-a": { slot: "boots", Drawing: RollerSkatesA },
  // disco-show
  "mirror-ball-egg-c": { slot: "prop", Drawing: MirrorBallEggC },
  "hand-fan-b": { slot: "prop", Drawing: HandFanB },
  "vinyl-b": { slot: "prop", Drawing: VinylB },
  "lit-floor-a": { slot: "stage", Drawing: LitFloorA },
  "neon-flames-b": { slot: "stage", Drawing: NeonFlamesB },
  // shared
  "wing-night-bib-b": { slot: "top", Drawing: WingNightBibB },
  "team-sash-a": { slot: "top", Drawing: TeamSashA },
  "golden-egg-b": { slot: "prop", Drawing: GoldenEggB },
  "drumstick-b": { slot: "prop", Drawing: DrumstickB },
  "egg-nest-a": { slot: "stage", Drawing: EggNestA },
};
