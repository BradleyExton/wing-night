// The cast and the team look: the one hen every surface draws, and the
// resolvers that decide what it looks like. It is a package rather than a
// client component so a minigame package can draw a player's bird too — the
// minigame packages cannot import from apps/client, and a second copy of the
// bird would drift from the first.
export { Character, type CharacterProps } from "./Character/index.js";
// The same bird as a bare `<g>`, for a surface that already has an SVG and
// wants to place it under its own transform (JOUST stands it on a physics pin).
export {
  CharacterFigure,
  type CharacterFigureProps
} from "./Character/CharacterFigure/index.js";
export {
  CHARACTER_BOX,
  CHARACTER_FOOT,
  CHARACTER_HEAD_CENTRE,
  CHARACTER_HEAD_RADIUS,
  CHARACTER_STAND_HEIGHT,
  COSTUME_HEAD_ANCHORS,
  COSTUME_HEAD_HEIGHT,
  DRAWN_HEAD,
  DRAWN_HEAD_ANCHORS,
  perchTransform,
  type HeadAnchors
} from "./Character/geometry/index.js";
export {
  CHARACTER_BODIES,
  CHARACTER_COMBS,
  CHARACTER_TAILS,
  resolvePlayerAppearance,
  type CharacterAppearance,
  type CharacterBody,
  type CharacterComb,
  type CharacterTail
} from "./resolvePlayerAppearance/index.js";
export {
  CHARACTER_APPARELS,
  resolveTeamApparel,
  type CharacterApparel
} from "./resolveTeamApparel/index.js";
export {
  resolveCharacterFillClassName,
  resolveTeamColorVariant,
  UNSEATED_CHARACTER_FILL_CLASS_NAME
} from "./resolveTeamColorVariant/index.js";
