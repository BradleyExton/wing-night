import { useId, type ReactNode } from "react";

import type { CharacterAppearance, CharacterDance } from "../../resolvePlayerAppearance/index.js";
import type { CharacterApparel } from "../../resolveTeamApparel/index.js";
import type { CharacterSilhouette } from "../../resolveTeamSilhouette/index.js";
import { Apparel, apparelCrossesTheFace } from "../Apparel/index.js";
import {
  CHARACTER_WING_PATH,
  legPath,
  resolveCharacterShapes,
  resolveCharacterWingPath,
  thighPath
} from "../shapes/index.js";
import {
  CHARACTER_PIVOTS,
  COSTUME_HEAD_ANCHORS,
  COSTUME_HEAD_HEIGHT,
  DRAWN_BEAK,
  DRAWN_HEAD,
  DRAWN_HEAD_ANCHORS,
  perchTransform,
  type CharacterPart,
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
  // The team's own shape (`resolveTeamSilhouette`). Undefined keeps the stock
  // bird, whose body, comb and tail come from the player's name hash.
  silhouette?: CharacterSilhouette;
  // The team's move on the beat (`resolveTeamDance`), which overrides the
  // player's own when the genre has one.
  dance?: CharacterDance;
};

export const CHARACTER_WING_ROOT = CHARACTER_PIVOTS.wing;

// The bird's paths live in `../shapes`; these stay exported from here because
// that is where every consumer has always imported them from.
export { CHARACTER_WING_PATH, resolveCharacterWingPath };

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

// The comb, when the player's hash gave them one — `resolveCharacterShapes`
// has already chosen between the genre's and the stock one. It buys little
// either way: no comb is drawn on a costume head, and on a real night
// everybody has one.
const Comb = ({
  combPath,
  head,
  ink
}: {
  combPath: string | null;
  head: HeadAnchors;
  ink: string;
}): JSX.Element | null => {
  if (combPath === null) {
    return null;
  }

  return (
    <path className={ink} transform={perchTransform(head.cx, head.top + 4)} d={combPath} />
  );
};

// An upper and a lower mandible, parted by the outline, and the wattle under
// them. The drawn head's alone: a costume head wears none of it.
const BeakAndWattle = (): JSX.Element => (
  <g>
    <path
      className={styles.beak}
      d={`M ${DRAWN_BEAK.x} ${DRAWN_BEAK.y - 4} L ${DRAWN_BEAK.x + 12} ${DRAWN_BEAK.y} L ${DRAWN_BEAK.x} ${DRAWN_BEAK.y + 1} Z`}
    />
    <path
      className={styles.beak}
      d={`M ${DRAWN_BEAK.x} ${DRAWN_BEAK.y + 1} L ${DRAWN_BEAK.x + 10} ${DRAWN_BEAK.y + 1} L ${DRAWN_BEAK.x} ${DRAWN_BEAK.y + 5} Z`}
    />
    <path
      className={styles.beak}
      d={`M ${DRAWN_BEAK.x - 3} ${DRAWN_BEAK.y + 5} C ${DRAWN_BEAK.x + 2} ${DRAWN_BEAK.y + 5} ${DRAWN_BEAK.x + 2} ${DRAWN_BEAK.y + 13} ${DRAWN_BEAK.x - 3} ${DRAWN_BEAK.y + 12} Z`}
    />
  </g>
);

const DrawnHead = ({ head }: { head: HeadAnchors }): JSX.Element => (
  <g>
    <circle className={styles.silhouette} cx={DRAWN_HEAD.cx} cy={DRAWN_HEAD.cy} r={DRAWN_HEAD.r} />
    <BeakAndWattle />
    <circle className={styles.eye} cx={head.cx - 4} cy={head.eyeY} r={3} />
    <circle className={styles.eye} cx={head.cx + 4} cy={head.eyeY} r={3} />
    <circle className={styles.pupil} cx={head.cx - 3} cy={head.eyeY} r={1.4} />
    <circle className={styles.pupil} cx={head.cx + 5} cy={head.eyeY} r={1.4} />
  </g>
);

// The costume: a player's generated likeness, background already knocked out
// by the importer, worn as the bird's own head — and worn ALONE. Nothing of
// the chicken's own head is drawn behind it and nothing perches on it or
// crosses it: a beak poking out past a cheek, a comb planted in someone's
// hair and a pair of star shades over a face the room came to recognise all
// read as two heads fighting over one neck. Below the chin the bird is still
// entirely a bird, which is where the joke actually lives.
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
  pose = "still",
  silhouette,
  dance
}: CharacterFigureProps): JSX.Element => {
  const haloId = useId();
  const wearsCostume = appearance.avatarSrc !== undefined;
  const head = wearsCostume ? COSTUME_HEAD_ANCHORS : DRAWN_HEAD_ANCHORS;
  const shapes = resolveCharacterShapes({ ...appearance, silhouette });
  // Spikes need a mitered join: the house 2-unit ROUND join blunts every point
  // by a unit, which at 76px is the whole point gone.
  const ink = shapes.mitered ? styles.silhouetteMitered : styles.silhouette;
  // A costume head keeps only the apparel that hangs below it: whatever the
  // photo already has on — a cap, glasses, a beard — is the thing the room
  // recognises, and a team still reads as its genre from the collar down.
  const wornApparel =
    apparel !== undefined && !(wearsCostume && apparelCrossesTheFace(apparel)) ? apparel : undefined;
  // A dance is the player's own — its steps AND the loop it runs between the
  // beats; every other pose is the same for every bird and has no jig.
  // A team with a dance of its own moves together; otherwise the step is the
  // player's, so a mixed floor stays mixed.
  const danced = dance ?? appearance.dance;
  const rig: CharacterRig =
    pose === "dance"
      ? { pose: styles.dances[danced], jig: styles.danceJigs[danced] }
      : { pose: styles.poses[pose], jig: {} };

  return (
    <g
      data-character-body={appearance.body}
      data-character-comb={appearance.comb}
      data-character-tail={appearance.tail}
      data-character-pose={pose}
      data-character-silhouette={silhouette}
    >
      <Part part="tail" rig={rig}>
        <path className={ink} d={shapes.tail} />
      </Part>
      <Part part="legFar" rig={rig}>
        <g className={styles.legFar}>
          <path className={styles.legs} d={legPath(CHARACTER_PIVOTS.legFar)} />
        </g>
      </Part>
      <Part part="body" rig={rig}>
        <path className={ink} d={shapes.body} />
        <path className={styles.shade} d={shapes.belly} />
      </Part>
      <Part part="legNear" rig={rig}>
        <path className={ink} d={thighPath(CHARACTER_PIVOTS.legNear)} />
        <path className={styles.legs} d={legPath(CHARACTER_PIVOTS.legNear)} />
      </Part>
      {wing === "drawn" && (
        <Part part="wing" rig={rig}>
          <path className={ink} d={shapes.wing} data-character-wing />
        </Part>
      )}
      <Part part="head" rig={rig}>
        <path className={ink} d={shapes.neck} />
        <g data-character-head>
          {appearance.avatarSrc === undefined ? (
            <DrawnHead head={head} />
          ) : (
            <CostumeHead avatarSrc={appearance.avatarSrc} haloId={haloId} head={head} />
          )}
          {!wearsCostume && <Comb combPath={shapes.comb} head={head} ink={ink} />}
          {wornApparel !== undefined && <Apparel apparel={wornApparel} head={head} />}
        </g>
      </Part>
    </g>
  );
};
