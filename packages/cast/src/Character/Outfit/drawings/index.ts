import type { OutfitDrawing } from "../context/index.js";
import { CombatBootsA } from "../boots/CombatBootsA/index.js";
import { CombatBootsB } from "../boots/CombatBootsB/index.js";
import { CombatBootsC } from "../boots/CombatBootsC/index.js";
import { GoGoBootsA } from "../boots/GoGoBootsA/index.js";
import { GoGoBootsB } from "../boots/GoGoBootsB/index.js";
import { PlatformTrainersA } from "../boots/PlatformTrainersA/index.js";
import { PlatformTrainersB } from "../boots/PlatformTrainersB/index.js";
import { PlatformsA } from "../boots/PlatformsA/index.js";
import { RollerSkatesA } from "../boots/RollerSkatesA/index.js";
import { RollerSkatesB } from "../boots/RollerSkatesB/index.js";
import { SpikedBootsA } from "../boots/SpikedBootsA/index.js";
import { AcousticGuitarA } from "../prop/AcousticGuitarA/index.js";
import { AcousticGuitarB } from "../prop/AcousticGuitarB/index.js";
import { BattleAxeA } from "../prop/BattleAxeA/index.js";
import { BattleAxeB } from "../prop/BattleAxeB/index.js";
import { CordedMicA } from "../prop/CordedMicA/index.js";
import { CordedMicB } from "../prop/CordedMicB/index.js";
import { CornCobA } from "../prop/CornCobA/index.js";
import { CornCobC } from "../prop/CornCobC/index.js";
import { DrumstickA } from "../prop/DrumstickA/index.js";
import { DrumstickB } from "../prop/DrumstickB/index.js";
import { DrumsticksA } from "../prop/DrumsticksA/index.js";
import { FlyingVA } from "../prop/FlyingVA/index.js";
import { FlyingVB } from "../prop/FlyingVB/index.js";
import { FlyingVC } from "../prop/FlyingVC/index.js";
import { GoldenEggA } from "../prop/GoldenEggA/index.js";
import { GoldenEggB } from "../prop/GoldenEggB/index.js";
import { HandFanB } from "../prop/HandFanB/index.js";
import { LassoB } from "../prop/LassoB/index.js";
import { LassoC } from "../prop/LassoC/index.js";
import { MirrorBallEggA } from "../prop/MirrorBallEggA/index.js";
import { MirrorBallEggC } from "../prop/MirrorBallEggC/index.js";
import { PomPomA } from "../prop/PomPomA/index.js";
import { PomPomB } from "../prop/PomPomB/index.js";
import { PomPomC } from "../prop/PomPomC/index.js";
import { StarMicA } from "../prop/StarMicA/index.js";
import { StarMicB } from "../prop/StarMicB/index.js";
import { StarMicC } from "../prop/StarMicC/index.js";
import { UnionJackFlagA } from "../prop/UnionJackFlagA/index.js";
import { UnionJackFlagB } from "../prop/UnionJackFlagB/index.js";
import { UnionJackFlagC } from "../prop/UnionJackFlagC/index.js";
import { VinylB } from "../prop/VinylB/index.js";
import { FlameSleeveA } from "../sleeve/FlameSleeveA/index.js";
import { FlameSleeveB } from "../sleeve/FlameSleeveB/index.js";
import { FlareSleeveB } from "../sleeve/FlareSleeveB/index.js";
import { FlareSleeveC } from "../sleeve/FlareSleeveC/index.js";
import { FringeSleeveA } from "../sleeve/FringeSleeveA/index.js";
import { FringeSleeveB } from "../sleeve/FringeSleeveB/index.js";
import { LeatherSleeveA } from "../sleeve/LeatherSleeveA/index.js";
import { LeatherSleeveB } from "../sleeve/LeatherSleeveB/index.js";
import { PuffSleeveA } from "../sleeve/PuffSleeveA/index.js";
import { PuffSleeveB } from "../sleeve/PuffSleeveB/index.js";
import { SatinSleeveA } from "../sleeve/SatinSleeveA/index.js";
import { SatinSleeveB } from "../sleeve/SatinSleeveB/index.js";
import { StripeSleeveA } from "../sleeve/StripeSleeveA/index.js";
import { StripeSleeveB } from "../sleeve/StripeSleeveB/index.js";
import { SuedeSleeveA } from "../sleeve/SuedeSleeveA/index.js";
import { SuedeSleeveB } from "../sleeve/SuedeSleeveB/index.js";
import { BoltDiscA } from "../stage/BoltDiscA/index.js";
import { BoltDiscB } from "../stage/BoltDiscB/index.js";
import { EggNestA } from "../stage/EggNestA/index.js";
import { EggNestB } from "../stage/EggNestB/index.js";
import { EggNestC } from "../stage/EggNestC/index.js";
import { HayBaleB } from "../stage/HayBaleB/index.js";
import { LavaDiscA } from "../stage/LavaDiscA/index.js";
import { LavaDiscB } from "../stage/LavaDiscB/index.js";
import { LavaDiscC } from "../stage/LavaDiscC/index.js";
import { LedStarRiserA } from "../stage/LedStarRiserA/index.js";
import { LedStarRiserB } from "../stage/LedStarRiserB/index.js";
import { LedStarRiserC } from "../stage/LedStarRiserC/index.js";
import { LitFloorA } from "../stage/LitFloorA/index.js";
import { LitFloorB } from "../stage/LitFloorB/index.js";
import { NeonFlamesA } from "../stage/NeonFlamesA/index.js";
import { NeonFlamesB } from "../stage/NeonFlamesB/index.js";
import { SawdustRingA } from "../stage/SawdustRingA/index.js";
import { SawdustRingB } from "../stage/SawdustRingB/index.js";
import { SawdustRingC } from "../stage/SawdustRingC/index.js";
import { SpotlightA } from "../stage/SpotlightA/index.js";
import { SpotlightB } from "../stage/SpotlightB/index.js";
import { BigBowA } from "../tail/BigBowA/index.js";
import { BigBowB } from "../tail/BigBowB/index.js";
import { ChainLoopB } from "../tail/ChainLoopB/index.js";
import { FeatherBoaA } from "../tail/FeatherBoaA/index.js";
import { FeatherBoaB } from "../tail/FeatherBoaB/index.js";
import { LavaTipsA } from "../tail/LavaTipsA/index.js";
import { LavaTipsB } from "../tail/LavaTipsB/index.js";
import { RibbonStreamersA } from "../tail/RibbonStreamersA/index.js";
import { RibbonStreamersB } from "../tail/RibbonStreamersB/index.js";
import { RopeCoilA } from "../tail/RopeCoilA/index.js";
import { RopeCoilB } from "../tail/RopeCoilB/index.js";
import { SpikedCuffB } from "../tail/SpikedCuffB/index.js";
import { TailBandanaA } from "../tail/TailBandanaA/index.js";
import { TailBandanaB } from "../tail/TailBandanaB/index.js";
import { TinselA } from "../tail/TinselA/index.js";
import { BandanaA } from "../top/BandanaA/index.js";
import { BandanaB } from "../top/BandanaB/index.js";
import { BandolierB } from "../top/BandolierB/index.js";
import { BattleVestA } from "../top/BattleVestA/index.js";
import { BattleVestB } from "../top/BattleVestB/index.js";
import { BikerJacketA } from "../top/BikerJacketA/index.js";
import { BikerJacketB } from "../top/BikerJacketB/index.js";
import { CropJacketA } from "../top/CropJacketA/index.js";
import { CropJacketB } from "../top/CropJacketB/index.js";
import { DaggerCollarB } from "../top/DaggerCollarB/index.js";
import { FringedVestA } from "../top/FringedVestA/index.js";
import { FringedVestB } from "../top/FringedVestB/index.js";
import { LittleBlackDressA } from "../top/LittleBlackDressA/index.js";
import { LittleBlackDressB } from "../top/LittleBlackDressB/index.js";
import { OpenShirtB } from "../top/OpenShirtB/index.js";
import { OpenShirtC } from "../top/OpenShirtC/index.js";
import { SatinJacketA } from "../top/SatinJacketA/index.js";
import { TeamSashA } from "../top/TeamSashA/index.js";
import { TeamSashB } from "../top/TeamSashB/index.js";
import { TracksuitTopA } from "../top/TracksuitTopA/index.js";
import { TracksuitTopB } from "../top/TracksuitTopB/index.js";
import { TrophyBuckleA } from "../top/TrophyBuckleA/index.js";
import { TrophyBuckleB } from "../top/TrophyBuckleB/index.js";
import { UnionJackDressA } from "../top/UnionJackDressA/index.js";
import { UnionJackDressB } from "../top/UnionJackDressB/index.js";
import { WesternYokeA } from "../top/WesternYokeA/index.js";
import { WesternYokeB } from "../top/WesternYokeB/index.js";
import { WingNightBibA } from "../top/WingNightBibA/index.js";
import { WingNightBibB } from "../top/WingNightBibB/index.js";

// Every item the cast can draw, by its catalogue id (`OUTFIT_ITEMS`), in the
// catalogue's order, rail by rail. Each is equal path for path to its harness
// drawing (run 3). A test holds the two lists in step; an id with no entry
// here (a hand-edited pack) is simply not drawn, and the bird wears the rest.
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
  "spotlight-b": { slot: "stage", Drawing: SpotlightB },
  // country-kit
  "bandana-a": { slot: "top", Drawing: BandanaA },
  "bandana-b": { slot: "top", Drawing: BandanaB },
  "western-yoke-a": { slot: "top", Drawing: WesternYokeA },
  "western-yoke-b": { slot: "top", Drawing: WesternYokeB },
  "trophy-buckle-a": { slot: "top", Drawing: TrophyBuckleA },
  "trophy-buckle-b": { slot: "top", Drawing: TrophyBuckleB },
  "fringed-vest-a": { slot: "top", Drawing: FringedVestA },
  "fringed-vest-b": { slot: "top", Drawing: FringedVestB },
  "fringe-sleeve-a": { slot: "sleeve", Drawing: FringeSleeveA },
  "fringe-sleeve-b": { slot: "sleeve", Drawing: FringeSleeveB },
  "suede-sleeve-a": { slot: "sleeve", Drawing: SuedeSleeveA },
  "suede-sleeve-b": { slot: "sleeve", Drawing: SuedeSleeveB },
  "tail-bandana-a": { slot: "tail", Drawing: TailBandanaA },
  "tail-bandana-b": { slot: "tail", Drawing: TailBandanaB },
  "rope-coil-a": { slot: "tail", Drawing: RopeCoilA },
  "rope-coil-b": { slot: "tail", Drawing: RopeCoilB },
  // country-show
  "lasso-b": { slot: "prop", Drawing: LassoB },
  "lasso-c": { slot: "prop", Drawing: LassoC },
  "corn-cob-a": { slot: "prop", Drawing: CornCobA },
  "corn-cob-c": { slot: "prop", Drawing: CornCobC },
  "acoustic-guitar-a": { slot: "prop", Drawing: AcousticGuitarA },
  "acoustic-guitar-b": { slot: "prop", Drawing: AcousticGuitarB },
  "hay-bale-b": { slot: "stage", Drawing: HayBaleB },
  "sawdust-ring-a": { slot: "stage", Drawing: SawdustRingA },
  "sawdust-ring-b": { slot: "stage", Drawing: SawdustRingB },
  "sawdust-ring-c": { slot: "stage", Drawing: SawdustRingC },
  // disco-kit
  "open-shirt-b": { slot: "top", Drawing: OpenShirtB },
  "open-shirt-c": { slot: "top", Drawing: OpenShirtC },
  "dagger-collar-b": { slot: "top", Drawing: DaggerCollarB },
  "satin-jacket-a": { slot: "top", Drawing: SatinJacketA },
  "flare-sleeve-b": { slot: "sleeve", Drawing: FlareSleeveB },
  "flare-sleeve-c": { slot: "sleeve", Drawing: FlareSleeveC },
  "satin-sleeve-a": { slot: "sleeve", Drawing: SatinSleeveA },
  "satin-sleeve-b": { slot: "sleeve", Drawing: SatinSleeveB },
  "tinsel-a": { slot: "tail", Drawing: TinselA },
  "feather-boa-a": { slot: "tail", Drawing: FeatherBoaA },
  "feather-boa-b": { slot: "tail", Drawing: FeatherBoaB },
  "platforms-a": { slot: "boots", Drawing: PlatformsA },
  "roller-skates-a": { slot: "boots", Drawing: RollerSkatesA },
  "roller-skates-b": { slot: "boots", Drawing: RollerSkatesB },
  // disco-show
  "mirror-ball-egg-a": { slot: "prop", Drawing: MirrorBallEggA },
  "mirror-ball-egg-c": { slot: "prop", Drawing: MirrorBallEggC },
  "hand-fan-b": { slot: "prop", Drawing: HandFanB },
  "vinyl-b": { slot: "prop", Drawing: VinylB },
  "lit-floor-a": { slot: "stage", Drawing: LitFloorA },
  "lit-floor-b": { slot: "stage", Drawing: LitFloorB },
  "neon-flames-a": { slot: "stage", Drawing: NeonFlamesA },
  "neon-flames-b": { slot: "stage", Drawing: NeonFlamesB },
  // shared
  "wing-night-bib-a": { slot: "top", Drawing: WingNightBibA },
  "wing-night-bib-b": { slot: "top", Drawing: WingNightBibB },
  "team-sash-a": { slot: "top", Drawing: TeamSashA },
  "team-sash-b": { slot: "top", Drawing: TeamSashB },
  "golden-egg-a": { slot: "prop", Drawing: GoldenEggA },
  "golden-egg-b": { slot: "prop", Drawing: GoldenEggB },
  "drumstick-a": { slot: "prop", Drawing: DrumstickA },
  "drumstick-b": { slot: "prop", Drawing: DrumstickB },
  "egg-nest-a": { slot: "stage", Drawing: EggNestA },
  "egg-nest-b": { slot: "stage", Drawing: EggNestB },
  "egg-nest-c": { slot: "stage", Drawing: EggNestC }
};
