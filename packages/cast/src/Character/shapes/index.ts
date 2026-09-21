import type { CharacterBody, CharacterComb, CharacterTail } from "../../resolvePlayerAppearance/index.js";
import type { CharacterSilhouette } from "../../resolveTeamSilhouette/index.js";
import type { CharacterPivot } from "../geometry/index.js";

// What the bird is DRAWN from, separated from what moves it: `CharacterFigure`
// owns the rig — the pivots, the poses, the parts stacked back to front — and
// this owns every path the rig hangs on it. Two tables, because a bird's shape
// has two owners: the stock paths a player's own name hash picks between, and
// the genre silhouettes that replace them outright.

// The wing, hanging from the shoulder and sweeping back with three feather
// tips on its trailing edge; `CHARACTER_PIVOTS.wing` is the point a flap
// rotates it about, in the same 80×72 box.
export const CHARACTER_WING_PATH =
  "M 47 35 C 38 29 24 33 20 44 C 19 49 21 53 24 55 Q 28 50 31 54 Q 35 49 38 53 Q 42 48 45 51 C 49 46 51 40 47 35 Z";

// Three plumes spread from the tail root, or two long sickles swept up high.
const TAIL_PATHS: Record<CharacterTail, string> = {
  fan: "M 22 46 C 10 47 2 41 0 30 C 6 39 14 42 26 41 Z M 22 41 C 11 40 3 33 2 20 C 9 31 15 36 25 36 Z M 24 36 C 14 32 8 24 11 10 C 14 25 19 30 28 31 Z",
  plume: "M 24 36 C 10 30 2 16 12 2 C 9 19 17 28 30 32 Z M 22 43 C 8 41 0 28 6 16 C 9 31 17 37 28 38 Z"
};

const BODY_PATHS: Record<CharacterBody, string> = {
  round: "M 16 42 C 16 28 32 22 50 27 C 64 31 67 44 61 55 C 53 65 30 66 21 58 C 16 54 16 48 16 42 Z",
  tall: "M 19 42 C 17 24 33 19 50 25 C 63 30 63 47 58 57 C 52 66 30 66 23 59 C 19 55 19 49 19 42 Z",
  wide: "M 11 45 C 11 30 30 24 52 28 C 66 32 69 45 63 55 C 55 65 26 67 16 59 C 11 55 11 50 11 45 Z"
};

// A crescent of shade along the belly, so the body reads as round and not as
// a flat cut-out. Drawn in `bg` at a fifth, so it adds no colour.
const BELLY_SHADE_PATHS: Record<CharacterBody, string> = {
  round: "M 22 56 C 30 64 52 64 60 54 C 56 66 30 68 22 56 Z",
  tall: "M 24 57 C 32 64 50 64 57 56 C 52 67 30 67 24 57 Z",
  wide: "M 17 57 C 28 66 54 66 62 54 C 56 67 26 69 17 57 Z"
};

// Drawn with the base on y=13 centred on x=56, like the hat, so `perchTransform` lands them.
const COMB_PATHS: Record<Exclude<CharacterComb, "none">, string> = {
  crest: "M 47 13 C 46 5 52 3 54 9 C 55 2 61 2 62 8 C 63 4 68 5 66 13 Z",
  mohawk: "M 50 13 C 51 4 58 -2 68 2 C 61 3 62 9 64 13 Z"
};

const NECK_PATH = "M 45 33 C 47 24 52 17 60 15 L 68 25 C 63 28 60 34 60 40 Z";

// The genre's own body. Where the stock bird picks a body, a tail and a comb
// from the player's name hash, a silhouette supplies ONE of each for the whole
// team — which costs less identity than it sounds like, because on a real
// night every player already wears their own photographed face and the room
// reads that, not a few units of belly curve.
//
// Drawn and measured in the prototype pages (`public/mockups/cast/
// silhouette-genres.html`, `silhouette-metal.html`), where all three were shown
// to be nameable at 76px with the team colour stripped out — which is the only
// test that matters, since every team already has its own hue.
//
// Two things carry a silhouette, and neither is the one you would guess. The
// TAIL does most of the work: it is the only organ with no head, leg, wing or
// photograph competing for its space. And the BELLY LINE is the leg dial —
// the hip pivot and `CHARACTER_FOOT` are fixed, so a leg cannot lengthen, but
// dropping the belly from y=56 to y=68 swings visible orange from 15 units to
// 3 and the eye reads that as a bird with no legs.
type SilhouetteShapes = {
  body: string;
  belly: string;
  tail: string;
  wing: string;
  comb: string;
  /** `spiky` needs a mitered join; see `styles.silhouetteMitered`. */
  mitered?: true;
};

const SILHOUETTE_SHAPES: Record<CharacterSilhouette, SilhouetteShapes> = {
  spiky: {
    body: "M 18 47 C 17 37 23 31 29 29 L 32 17 L 36 28 L 40 18 L 44 29 C 57 31 66 40 62 51 C 55 61 32 62 25 57 C 20 54 18 51 18 47 Z",
    belly: "M 28 54 C 36 60 51 59 58 51 C 53 60 31 61 28 54 Z",
    tail: "M 30 48 L 2 46 L 28 40 Z M 28 42 L 0 26 L 29 33 Z M 29 34 L 7 9 L 31 27 Z",
    wing:
      "M 47 35 C 38 29 24 33 20 44 C 19 49 21 53 24 55 L 27 52 L 31 55 L 34 52 L 38 54 L 41 51 L 45 51 C 49 46 51 40 47 35 Z",
    comb: "M 48 13 L 51 1 L 54 10 L 57 -1 L 60 9 L 64 2 L 66 13 Z",
    mitered: true
  },
  broody: {
    body: "M 14 49 C 14 33 31 25 52 29 C 68 32 71 47 65 58 C 57 67 24 69 18 61 C 14 57 14 53 14 49 Z",
    belly: "M 21 59 C 30 66 55 65 63 56 C 57 68 27 68 21 59 Z",
    tail: "M 24 46 C 12 58 0 55 0 42 C 4 52 12 53 22 44 Z M 24 41 C 12 47 2 43 2 31 C 7 41 16 42 25 38 Z",
    wing: "M 47 36 C 40 32 30 35 27 43 C 26 47 28 50 31 51 Q 35 47 39 50 C 45 47 49 41 47 36 Z",
    comb: "M 51 13 C 51 7 56 5 58 9 C 60 6 64 7 63 13 Z"
  },
  preener: {
    body: "M 27 41 C 25 22 39 16 52 22 C 64 27 66 39 60 48 C 54 55 33 56 30 50 C 27 47 27 45 27 41 Z",
    belly: "M 32 49 C 38 54 51 53 57 45 C 53 55 34 56 32 49 Z",
    tail: "M 27 38 C 13 30 5 12 17 0 C 13 16 21 26 32 32 Z M 25 45 C 9 40 1 24 9 10 C 10 27 18 36 29 40 Z",
    wing: "M 47 34 C 37 29 21 32 17 43 C 16 48 19 53 23 54 C 28 48 33 43 40 41 C 46 40 50 38 47 34 Z",
    comb: "M 51 13 C 50 5 55 -3 63 -4 C 59 2 59 8 62 13 Z"
  }
};

/**
 * The wing a bird of this silhouette has, for a surface that draws the wing on
 * its own layer and beats it (FAPPY). `CHARACTER_WING_PATH` is the stock one.
 */
export const resolveCharacterWingPath = (silhouette?: CharacterSilhouette): string =>
  silhouette === undefined ? CHARACTER_WING_PATH : SILHOUETTE_SHAPES[silhouette].wing;

// A shank from the hip to the ankle, then three toes.
export const legPath = ({ x, y }: CharacterPivot): string =>
  `M ${x} ${y} L ${x - 1} ${y + 11} M ${x - 1} ${y + 11} L ${x - 7} ${y + 13.5} M ${x - 1} ${y + 11} L ${x} ${y + 14} M ${x - 1} ${y + 11} L ${x + 6} ${y + 13.5}`;

// The drumstick the near leg hangs from, peeking out under the body.
export const thighPath = ({ x, y }: CharacterPivot): string =>
  `M ${x - 5} ${y - 4} C ${x - 6} ${y + 3} ${x - 1} ${y + 6} ${x + 3} ${y + 2} C ${x + 4} ${y - 2} ${x} ${y - 6} ${x - 5} ${y - 4} Z`;

/**
 * Every path one bird is drawn from. A genre silhouette replaces the stock
 * shapes outright; with none, each is the one the player's own name chose.
 * `comb` is null when the player's hash said bare-headed — a team keeps that
 * much variation even when the genre owns the rest.
 */
export type CharacterShapes = {
  body: string;
  belly: string;
  tail: string;
  wing: string;
  comb: string | null;
  neck: string;
  /** True when the outline must keep its corners sharp (`spiky`). */
  mitered: boolean;
};

export const resolveCharacterShapes = ({
  body,
  comb,
  tail,
  silhouette
}: {
  body: CharacterBody;
  comb: CharacterComb;
  tail: CharacterTail;
  silhouette: CharacterSilhouette | undefined;
}): CharacterShapes => {
  const genre = silhouette === undefined ? undefined : SILHOUETTE_SHAPES[silhouette];

  return {
    body: genre?.body ?? BODY_PATHS[body],
    belly: genre?.belly ?? BELLY_SHADE_PATHS[body],
    tail: genre?.tail ?? TAIL_PATHS[tail],
    wing: genre?.wing ?? CHARACTER_WING_PATH,
    comb: comb === "none" ? null : (genre?.comb ?? COMB_PATHS[comb]),
    neck: NECK_PATH,
    mitered: genre?.mitered === true
  };
};
