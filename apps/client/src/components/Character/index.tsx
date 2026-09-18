import { useId } from "react";

import type {
  CharacterAppearance,
  CharacterBody,
  CharacterComb,
  CharacterTail
} from "../../utils/resolvePlayerAppearance";
import * as styles from "./styles";

// A chicken, drawn facing RIGHT in an 80×72 box; surfaces that need it to
// face left flip it with scaleX(-1). Tail, body, legs, head, two eyes, beak
// and comb — nine shapes, one colour plus `primary`, 2-unit stroke — so it
// still reads as a bird when it is 3% of a TV's height. Fill comes from the
// parent as a `text-*` class.
export type CharacterProps = {
  appearance: CharacterAppearance;
  fillClassName?: string;
};

// A drawn head is a third of the bird; a bird carrying a photo gets a
// bobblehead instead, because at party distance the face IS the identity and
// a coin-sized one reads as "a face", not as whose. Beak and comb ride along.
const DRAWN_HEAD = { cx: 56, cy: 22, r: 13 };
const BOBBLE_HEAD = { cx: 54, cy: 24, r: 19 };
const AVATAR_INSET = 2;

const Tail = ({ tail }: { tail: CharacterTail }): JSX.Element => {
  if (tail === "plume") {
    return (
      <path
        className={styles.silhouette}
        d="M 18 46 C 4 42 0 24 12 12 C 8 28 14 38 26 40 Z"
      />
    );
  }

  return (
    <path
      className={styles.silhouette}
      d="M 18 44 L 0 26 L 14 38 L 6 16 L 20 36 L 18 18 L 26 38 Z"
    />
  );
};

const Body = ({ body }: { body: CharacterBody }): JSX.Element => {
  if (body === "tall") {
    return <ellipse className={styles.silhouette} cx={38} cy={40} rx={22} ry={24} />;
  }

  if (body === "wide") {
    return <ellipse className={styles.silhouette} cx={36} cy={46} rx={30} ry={18} />;
  }

  return <ellipse className={styles.silhouette} cx={36} cy={44} rx={26} ry={21} />;
};

const Comb = ({ comb }: { comb: CharacterComb }): JSX.Element | null => {
  if (comb === "crest") {
    return (
      <path
        className={styles.silhouette}
        d="M 46 13 L 49 3 L 53 10 L 57 1 L 61 9 L 65 4 L 66 13 Z"
      />
    );
  }

  if (comb === "mohawk") {
    return <path className={styles.silhouette} d="M 49 13 L 54 0 L 62 11 Z" />;
  }

  return null;
};

// The head-swap convention from the Contraption UI lab's `Likeness`: a photo,
// when there is one, is clipped into the head circle and replaces the drawn
// eyes; the head outline, beak and comb stay so the bird keeps its silhouette.
type Head = { cx: number; cy: number; r: number };

const Face = ({
  avatarSrc,
  clipId,
  head
}: {
  avatarSrc?: string;
  clipId: string;
  head: Head;
}): JSX.Element => {
  if (avatarSrc === undefined) {
    return (
      <g>
        <circle className={styles.eye} cx={52} cy={20} r={3} />
        <circle className={styles.eye} cx={60} cy={20} r={3} />
        <circle className={styles.pupil} cx={53} cy={20} r={1.4} />
        <circle className={styles.pupil} cx={61} cy={20} r={1.4} />
      </g>
    );
  }

  const avatarRadius = head.r - AVATAR_INSET;

  return (
    <g>
      <clipPath id={clipId}>
        <circle cx={head.cx} cy={head.cy} r={avatarRadius} />
      </clipPath>
      <image
        href={avatarSrc}
        x={head.cx - avatarRadius}
        y={head.cy - avatarRadius}
        width={avatarRadius * 2}
        height={avatarRadius * 2}
        preserveAspectRatio="xMidYMid slice"
        clipPath={`url(#${clipId})`}
      />
    </g>
  );
};

export const Character = ({ appearance, fillClassName }: CharacterProps): JSX.Element => {
  const clipId = useId();
  const head = appearance.avatarSrc === undefined ? DRAWN_HEAD : BOBBLE_HEAD;
  // Beak and comb are drawn against the drawn head; shift them to sit on this one.
  const beakShift = `translate(-e, )`;
  const combShift = `translate(, -e)`;

  return (
    <svg
      className={`${styles.svg} ${fillClassName ?? styles.defaultFill}`}
      viewBox="0 0 80 72"
      data-character-body={appearance.body}
      data-character-comb={appearance.comb}
      data-character-tail={appearance.tail}
    >
      <Tail tail={appearance.tail} />
      <path className={styles.legs} d="M 29 56 L 27 70 L 37 70 M 43 56 L 41 70 L 51 70" />
      <Body body={appearance.body} />
      <g data-character-head>
        <circle className={styles.silhouette} cx={head.cx} cy={head.cy} r={head.r} />
        <path
          className={styles.beak}
          transform={beakShift}
          d="M 68 19 L 79 24 L 68 29 Z"
        />
        <Face avatarSrc={appearance.avatarSrc} clipId={clipId} head={head} />
        <g transform={combShift}>
          <Comb comb={appearance.comb} />
        </g>
      </g>
    </svg>
  );
};
