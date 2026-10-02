import type { CharacterAppearance } from "../../resolvePlayerAppearance/index.js";
import type { CharacterApparel } from "../../resolveTeamApparel/index.js";
import { Apparel, apparelCrossesTheFace } from "../Apparel/index.js";
import {
  COSTUME_HEAD_ANCHORS,
  COSTUME_HEAD_HEIGHT,
  DRAWN_BEAK,
  DRAWN_BEAK_TIP,
  DRAWN_HEAD,
  DRAWN_HEAD_ANCHORS,
  perchTransform,
  type HeadAnchors
} from "../geometry/index.js";
import * as styles from "./styles.js";

// The head above the neck: the drawn one or the player's costume, the comb and
// the team's apparel. One component because two figures wear it, the posed
// `CharacterFigure` and the `CharacterRagdollFigure` a physics sim moves, and a
// second copy of the head is exactly the drift the cast package exists to stop.
// It draws in the 80×72 box like every other part; whoever holds it decides
// where that box is.
export type CharacterHeadProps = {
  appearance: CharacterAppearance;
  apparel: CharacterApparel | undefined;
  // The comb `resolveCharacterShapes` chose, null for a bare head.
  combPath: string | null;
  // The outline the rest of the bird is drawn in, so a spiky comb stays sharp.
  ink: string;
  // The figure's own `useId`, passed down rather than taken here so the id a
  // costume head's halo carries is the one it always carried.
  haloId: string;
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
      d={`M ${DRAWN_BEAK.x} ${DRAWN_BEAK.y - 4} L ${DRAWN_BEAK_TIP.x} ${DRAWN_BEAK_TIP.y} L ${DRAWN_BEAK.x} ${DRAWN_BEAK.y + 1} Z`}
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

export const CharacterHead = ({ appearance, apparel, combPath, ink, haloId }: CharacterHeadProps): JSX.Element => {
  const wearsCostume = appearance.avatarSrc !== undefined;
  const head = wearsCostume ? COSTUME_HEAD_ANCHORS : DRAWN_HEAD_ANCHORS;
  // A costume head keeps only the apparel that hangs below it: whatever the
  // photo already has on — a cap, glasses, a beard — is the thing the room
  // recognises, and a team still reads as its genre from the collar down.
  const wornApparel =
    apparel !== undefined && !(wearsCostume && apparelCrossesTheFace(apparel)) ? apparel : undefined;

  return (
    <g data-character-head>
      {appearance.avatarSrc === undefined ? (
        <DrawnHead head={head} />
      ) : (
        <CostumeHead avatarSrc={appearance.avatarSrc} haloId={haloId} head={head} />
      )}
      {!wearsCostume && <Comb combPath={combPath} head={head} ink={ink} />}
      {wornApparel !== undefined && <Apparel apparel={wornApparel} head={head} />}
    </g>
  );
};
