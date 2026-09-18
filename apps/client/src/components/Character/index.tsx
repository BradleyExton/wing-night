import { useId } from "react";

import type {
  CharacterAppearance,
  CharacterBody,
  CharacterComb,
  CharacterTail
} from "../../utils/resolvePlayerAppearance";
import type { CharacterApparel } from "../../utils/resolveTeamApparel";
import { Apparel } from "./Apparel";
import {
  COSTUME_HEAD_ANCHORS,
  COSTUME_HEAD_HEIGHT,
  DRAWN_HEAD,
  DRAWN_HEAD_ANCHORS,
  perchTransform,
  type HeadAnchors
} from "./geometry";
import * as styles from "./styles";

// A hen, drawn facing RIGHT in an 80×72 box; surfaces that need it to face
// left flip it with scaleX(-1). Tail, legs, body, neck, wing, head, eyes,
// beak, wattle and comb — one colour plus `primary`, 2-unit stroke — so it
// still reads as a bird when it is 3% of a TV's height. Fill comes from the
// parent as a `text-*` class; apparel comes from the team's genre.
export type CharacterProps = {
  appearance: CharacterAppearance;
  apparel?: CharacterApparel;
  fillClassName?: string;
};

const TAIL_PATHS: Record<CharacterTail, string> = {
  fan: "M 20 42 C 8 40 0 26 6 12 C 8 26 14 34 26 36 Z M 22 46 C 6 48 0 36 2 24 C 8 36 16 40 28 40 Z",
  plume: "M 22 40 C 6 36 -2 18 10 4 C 6 20 14 30 28 34 Z M 26 44 C 10 46 0 36 4 22 C 8 34 18 40 32 40 Z"
};

const BODY_PATHS: Record<CharacterBody, string> = {
  round: "M 14 46 C 14 28 30 20 50 26 C 64 30 66 44 60 54 C 52 64 30 66 20 58 C 15 54 14 50 14 46 Z",
  tall: "M 18 44 C 16 24 32 18 50 24 C 62 28 62 46 58 56 C 52 66 30 66 22 58 C 18 54 18 50 18 44 Z",
  wide: "M 10 46 C 10 30 30 24 52 28 C 66 32 68 44 62 54 C 54 64 26 66 16 58 C 11 54 10 50 10 46 Z"
};

const COMB_PATHS: Record<Exclude<CharacterComb, "none">, string> = {
  crest: "M 46 13 L 49 3 L 53 10 L 57 1 L 61 9 L 65 4 L 66 13 Z",
  mohawk: "M 49 13 L 54 0 L 62 11 Z"
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

const BeakAndWattle = ({ head }: { head: HeadAnchors }): JSX.Element => (
  <g>
    <path
      className={styles.beak}
      d={`M ${head.beakX} ${head.beakY - 5} L ${head.beakX + 11} ${head.beakY} L ${head.beakX} ${head.beakY + 5} Z`}
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

export const Character = ({ appearance, apparel, fillClassName }: CharacterProps): JSX.Element => {
  const haloId = useId();
  const head = appearance.avatarSrc === undefined ? DRAWN_HEAD_ANCHORS : COSTUME_HEAD_ANCHORS;

  return (
    <svg
      className={`${styles.svg} ${fillClassName ?? styles.defaultFill}`}
      viewBox="0 0 80 72"
      data-character-body={appearance.body}
      data-character-comb={appearance.comb}
      data-character-tail={appearance.tail}
    >
      <path className={styles.silhouette} d={TAIL_PATHS[appearance.tail]} />
      <path
        className={styles.legs}
        d="M 32 60 L 30 69 M 30 69 L 24 71 M 30 69 L 36 71 M 46 60 L 45 69 M 45 69 L 39 71 M 45 69 L 51 71"
      />
      <path className={styles.silhouette} d={BODY_PATHS[appearance.body]} />
      <path className={styles.silhouette} d="M 48 30 L 54 20 L 64 24 L 62 36 Z" />
      <path className={styles.silhouette} d="M 26 42 C 34 34 48 36 52 46 C 44 54 32 54 26 46 Z" />
      <g data-character-head>
        {appearance.avatarSrc === undefined ? (
          <DrawnHead head={head} />
        ) : (
          <CostumeHead avatarSrc={appearance.avatarSrc} haloId={haloId} head={head} />
        )}
        <Comb comb={appearance.comb} head={head} />
        {apparel !== undefined && <Apparel apparel={apparel} head={head} />}
      </g>
    </svg>
  );
};
