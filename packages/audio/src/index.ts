// The house's sound: one AudioContext, two buses, two instruments and a cue
// table played through a board. It is a package rather than a client module
// for the reason `packages/surface` is — a minigame package cannot import
// from apps/client, and FAPPY and the TV clock had each grown their own copy
// of the board before this one existed.
export {
  createSoundboard,
  isCueDue,
  setAudioBusLevel,
  wakeAudio,
  type AudioBus,
  type AudioContextFactory,
  type CueSpec,
  type CueTable,
  type CueVoice,
  type Soundboard,
  type SoundboardOptions
} from "./soundboard/index.js";
export {
  playNoise,
  playTone,
  type CueRig,
  type NoiseSpec,
  type ToneSpec
} from "./voices/index.js";
export {
  HOUSE_CUE_NAMES,
  HOUSE_CUES,
  HOUSE_MASTER_GAIN,
  createHouseSoundboard,
  type HouseCueName,
  type HouseSoundboard,
  type HouseSoundboardOptions
} from "./houseCues/index.js";
export { createStubAudioContext, type StubAudioContext } from "./stubAudioContext/index.js";
