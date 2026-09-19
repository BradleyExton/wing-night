import { useId, type ReactNode } from "react";

import type { CharacterAppearance, CharacterComb, CharacterTail, CharacterBody } from "../../resolvePlayerAppearance/index.js";
import type { CharacterApparel } from "../../resolveTeamApparel/index.js";
import { Apparel } from "../Apparel/index.js";
import {
  CHARACTER_PIVOTS,
  COSTUME_HEAD_ANCHORS,
  COSTUME_HEAD_HEIGHT,
  DRAWN_HEAD,
  DRAWN_HEAD_ANCHORS,
  perchTransform,
  type CharacterPart,
  type CharacterPivot,
  type CharacterPose,
  type HeadAnchors
} from "../geometry/index.js";
import * as styles from "./styles.js";

// The hen itself, as a bare `<g>` in the 80×72 character box, so it can be
// dropped into someone else's SVG under their own transform — which is how
// JOUST stands the cast up along a physics pin. `<Character>` is this plus the
// `<svg>` a page-level consumer wants.
export type CharacterFigureProps = {
  appearance: CharacterAppearance;
  apparel?: CharacterApparel;
  // `none` leaves the wing off the figure so a surface can draw it on its
  // own layer and beat it (FAPPY flaps it in time with the taps); the figure
  // underneath then never repaints, which is what keeps a costume head's halo
  // filter rasterised once.
  wing?: "drawn" | "none";
  // What the parts are doing (geometry `CHARACTER_POSES`); `still` by default.
  pose?: CharacterPose;
};

// The wing, hanging from the shoulder and sweeping back with three feather
// tips on its trailing edge; `CHARACTER_PIVOTS.wing` is the point a flap
// rotates it about, in the same 80×72 box.
export const CHARACTER_WING_PATH =
  "M 47 35 C 38 29 24 33 20 44 C 19 49 21 53 24 55 Q 28 50 31 54 Q 35 49 38 53 Q 42 48 45 51 C 49 46 51 40 47 35 Z";

export const CHARACTER_WING_ROOT = CHARACTER_PIVOTS.wing;

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

// A shank from the hip to the ankle, then three toes.
const legPath = ({ x, y }: CharacterPivot): string =>
  `M ${x} ${y} L ${x - 1} ${y + 11} M ${x - 1} ${y + 11} L ${x - 7} ${y + 13.5} M ${x - 1} ${y + 11} L ${x} ${y + 14} M ${x - 1} ${y + 11} L ${x + 6} ${y + 13.5}`;

// The drumstick the near leg hangs from, peeking out under the body.
const thighPath = ({ x, y }: CharacterPivot): string =>
  `M ${x - 5} ${y - 4} C ${x - 6} ${y + 3} ${x - 1} ${y + 6} ${x + 3} ${y + 2} C ${x + 4} ${y - 2} ${x} ${y - 6} ${x - 5} ${y - 4} Z`;

// A part on its pivot: the outer translate puts the pivot at the origin, the
// `<g>`s in the middle are what move it, and the inner translate puts the
// drawing back. Rotating about a local origin this way holds under any
// transform a surface wraps the figure in, where a CSS `transform-origin`
// would be measured against the wrong viewport.
//
// TWO layers move, because an element carries one `transform` at a time and a
// dancing bird needs two clocks: the `pose` layer is the beat (a transition
// the room's music drives), and the `jig` layer around it is the bird's own
// free-running loop. A part with no jig is not wrapped at all, so every pose
// but `dance` draws exactly the markup it always did.
type PartClassNames = Partial<Record<CharacterPart, string>>;

type CharacterRig = {
  pose: PartClassNames;
  jig: PartClassNames;
};

const Part = ({
  part,
  rig,
  children
}: {
  part: CharacterPart;
  rig: CharacterRig;
  children: ReactNode;
}): JSX.Element => {
  const pivot = CHARACTER_PIVOTS[part];
  const jigClassName = rig.jig[part];

  const posed = (
    <g data-character-part={part} className={rig.pose[part]}>
      <g transform={`translate(${-pivot.x} ${-pivot.y})`}>{children}</g>
    </g>
  );

  return (
    <g transform={`translate(${pivot.x} ${pivot.y})`}>
      {jigClassName === undefined ? (
        posed
      ) : (
        <g data-character-jig={part} className={jigClassName}>
          {posed}
        </g>
      )}
    </g>
  );
};

const Comb = ({ comb, head }: { comb: CharacterComb; head: HeadAnchors }): JSX.Element | null => {
  if (comb === "none") {
    return null;
  }

  return (
    <path
      className={styles.silhouette}
      transform={perchTransform(head.cx, head.top + 4)}
      d={COMB_PATHS[comb]}
    />
  );
};

// An upper and a lower mandible, parted by the outline, and the wattle under them.
const BeakAndWattle = ({ head }: { head: HeadAnchors }): JSX.Element => (
  <g>
    <path
      className={styles.beak}
      d={`M ${head.beakX} ${head.beakY - 4} L ${head.beakX + 12} ${head.beakY} L ${head.beakX} ${head.beakY + 1} Z`}
    />
    <path
      className={styles.beak}
      d={`M ${head.beakX} ${head.beakY + 1} L ${head.beakX + 10} ${head.beakY + 1} L ${head.beakX} ${head.beakY + 5} Z`}
    />
    <path
      className={styles.beak}
      d={`M ${head.beakX - 3} ${head.beakY + 5} C ${head.beakX + 2} ${head.beakY + 5} ${head.beakX + 2} ${head.beakY + 13} ${head.beakX - 3} ${head.beakY + 12} Z`}
    />
  </g>
);

const DrawnHead = ({ head }: { head: HeadAnchors }): JSX.Element => (
  <g>
    <circle className={styles.silhouette} cx={DRAWN_HEAD.cx} cy={DRAWN_HEAD.cy} r={DRAWN_HEAD.r} />
    <BeakAndWattle head={head} />
    <circle className={styles.eye} cx={head.cx - 4} cy={head.eyeY} r={3} />
    <circle className={styles.eye} cx={head.cx + 4} cy={head.eyeY} r={3} />
    <circle className={styles.pupil} cx={head.cx - 3} cy={head.eyeY} r={1.4} />
    <circle className={styles.pupil} cx={head.cx + 5} cy={head.eyeY} r={1.4} />
  </g>
);

// The costume: a player's generated likeness, background already knocked out
// by the importer, worn as the bird's own head. The beak pokes out at mouth
// height and the comb perches on the hair, so it is still unmistakably the
// chicken — the player is in the suit with their face showing.
const CostumeHead = ({
  avatarSrc,
  haloId,
  head
}: {
  avatarSrc: string;
  haloId: string;
  head: HeadAnchors;
}): JSX.Element => (
  <g>
    <filter id={haloId} x="-30%" y="-30%" width="160%" height="160%" primitiveUnits="userSpaceOnUse">
      <feMorphology in="SourceAlpha" operator="dilate" radius={1.4} result="halo" />
      <feFlood className={styles.haloInk} result="ink" />
      <feComposite in="ink" in2="halo" operator="in" result="outline" />
      <feMerge>
        <feMergeNode in="outline" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <BeakAndWattle head={head} />
    <image
      href={avatarSrc}
      x={head.cx - COSTUME_HEAD_HEIGHT / 2}
      y={head.top}
      width={COSTUME_HEAD_HEIGHT}
      height={COSTUME_HEAD_HEIGHT}
      preserveAspectRatio="xMidYMax meet"
      filter={`url(#${haloId})`}
    />
  </g>
);

export const CharacterFigure = ({
  appearance,
  apparel,
  wing = "drawn",
  pose = "still"
}: CharacterFigureProps): JSX.Element => {
  const haloId = useId();
  const head = appearance.avatarSrc === undefined ? DRAWN_HEAD_ANCHORS : COSTUME_HEAD_ANCHORS;
  // A dance is the player's own — its steps AND the loop it runs between the
  // beats; every other pose is the same for every bird and has no jig.
  const rig: CharacterRig =
    pose === "dance"
      ? { pose: styles.dances[appearance.dance], jig: styles.danceJigs[appearance.dance] }
      : { pose: styles.poses[pose], jig: {} };

  return (
    <g
      data-character-body={appearance.body}
      data-character-comb={appearance.comb}
      data-character-tail={appearance.tail}
      data-character-pose={pose}
    >
      <Part part="tail" rig={rig}>
        <path className={styles.silhouette} d={TAIL_PATHS[appearance.tail]} />
      </Part>
      <Part part="legFar" rig={rig}>
        <g className={styles.legFar}>
          <path className={styles.legs} d={legPath(CHARACTER_PIVOTS.legFar)} />
        </g>
      </Part>
      <Part part="body" rig={rig}>
        <path className={styles.silhouette} d={BODY_PATHS[appearance.body]} />
        <path className={styles.shade} d={BELLY_SHADE_PATHS[appearance.body]} />
      </Part>
      <Part part="legNear" rig={rig}>
        <path className={styles.silhouette} d={thighPath(CHARACTER_PIVOTS.legNear)} />
        <path className={styles.legs} d={legPath(CHARACTER_PIVOTS.legNear)} />
      </Part>
      {wing === "drawn" && (
        <Part part="wing" rig={rig}>
          <path className={styles.silhouette} d={CHARACTER_WING_PATH} data-character-wing />
        </Part>
      )}
      <Part part="head" rig={rig}>
        <path className={styles.silhouette} d={NECK_PATH} />
        <g data-character-head>
          {appearance.avatarSrc === undefined ? (
            <DrawnHead head={head} />
          ) : (
            <CostumeHead avatarSrc={appearance.avatarSrc} haloId={haloId} head={head} />
          )}
          <Comb comb={appearance.comb} head={head} />
          {apparel !== undefined && <Apparel apparel={apparel} head={head} />}
        </g>
      </Part>
    </g>
  );
};
