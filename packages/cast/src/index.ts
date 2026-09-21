// The cast and the team look: the one hen every surface draws, and the
// resolvers that decide what it looks like. It is a package rather than a
// client component so a minigame package can draw a player's bird too — the
// minigame packages cannot import from apps/client, and a second copy of the
// bird would drift from the first.
export {
  CHARACTER_WING_ORIGIN_CLASS_NAME,
  Character,
  CharacterWing,
  type CharacterProps
} from "./Character/index.js";
// The same bird as a bare `<g>`, for a surface that already has an SVG and
// wants to place it under its own transform (JOUST stands it on a physics pin).
export {
  CHARACTER_WING_PATH,
  CHARACTER_WING_ROOT,
  CharacterFigure,
  resolveCharacterWingPath,
  type CharacterFigureProps
} from "./Character/CharacterFigure/index.js";
export {
  CHARACTER_BOX,
  CHARACTER_FOOT,
  CHARACTER_PARTS,
  CHARACTER_PIVOTS,
  CHARACTER_POSES,
  CHARACTER_HEAD_CENTRE,
  CHARACTER_HEAD_RADIUS,
  CHARACTER_STAND_HEIGHT,
  COSTUME_HEAD_ANCHORS,
  COSTUME_HEAD_HEIGHT,
  DRAWN_HEAD,
  DRAWN_HEAD_ANCHORS,
  perchTransform,
  type CharacterPart,
  type CharacterPivot,
  type CharacterPose,
  type HeadAnchors
} from "./Character/geometry/index.js";
// How loose one bird is: a class of custom properties that scatter its
// footwork, its bounce and the moment it lands the room's beat.
export {
  CHARACTER_BEAT_LAGS,
  CHARACTER_BOUNCES,
  CHARACTER_FOOTWORKS,
  resolveCharacterGrooveClassName
} from "./resolveCharacterGroove/index.js";
export {
  CHARACTER_BODIES,
  CHARACTER_COMBS,
  CHARACTER_DANCES,
  CHARACTER_TAILS,
  resolvePlayerAppearance,
  type CharacterAppearance,
  type CharacterBody,
  type CharacterComb,
  type CharacterDance,
  type CharacterTail
} from "./resolvePlayerAppearance/index.js";
// The schlong: JOUST's projectile and FAPPY's obstacle are one drawing, built
// along whatever spine a surface hands it (physics bodies, or a bend it made).
export {
  resolveSchlongFace,
  resolveSchlongPaths,
  type SchlongFace,
  type SchlongPaths,
  type SchlongProportions,
  type SchlongVec2
} from "./Schlong/index.js";
export {
  CHARACTER_APPARELS,
  resolveTeamApparel,
  type CharacterApparel
} from "./resolveTeamApparel/index.js";
// What shape a team's birds ARE, which is the genre's primary carrier — a prop
// is a few pixels of a 76px bird, a silhouette is the first thing read.
export {
  CHARACTER_SILHOUETTES,
  resolveTeamDance,
  resolveTeamSilhouette,
  type CharacterSilhouette
} from "./resolveTeamSilhouette/index.js";
// `resolveTeamColorVariant` — the bare id hash — is deliberately NOT exported.
// A surface that reached for it got a colour with no knowledge of the team's
// genre, its authored `color`, or the cross-team collision pass, which is how
// the host tablet and the TV came to paint the same team two different colours
// (2026-09-20). Surfaces read the theme map; the cast keeps the hash inside
// `resolveCharacterFillClassName`, which paints birds where no seating list is
// in reach. `resolveHashedTeamColorToken` stays exported because the theme
// itself needs it, as the last tier of its colour precedence.
export {
  resolveCharacterFillClassName,
  resolveHashedTeamColorToken,
  resolveTeamColorVariantByToken,
  UNSEATED_CHARACTER_FILL_CLASS_NAME
} from "./resolveTeamColorVariant/index.js";
