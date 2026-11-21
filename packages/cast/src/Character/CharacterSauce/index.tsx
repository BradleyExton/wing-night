import { COSTUME_HEAD_ANCHORS, COSTUME_HEAD_HEIGHT, DRAWN_BEAK_TIP } from "../geometry/index.js";
import * as styles from "./styles.js";

// What a bird is spraying (Base Borden: she never stops). `angle` is where it
// goes, in degrees clockwise on screen from straight ahead of her — -90 is
// up, 90 is down — so a surface that flips a left-facing bird flips its aim
// with it. `tone` is the bottle: `mild` until she picks up a hot one.
export type CharacterSprayTone = "mild" | "hot";

export type CharacterSpray = {
  angle: number;
  tone?: CharacterSprayTone;
};

// The jet in its own frame: leaving the mouth at the origin along +x, fat at
// the lips and pinching off into three drops, about a head's width long. It
// starts a little behind the origin, so the head it is drawn under covers
// where it begins.
const JET_PATH = "M -2 -1.8 C 6 -2.6 12 -2.2 18 -1.2 C 20 -0.6 20 0.6 18 1.2 C 12 2.2 6 2.6 -2 1.8 Z";

const DROPS = [
  { cx: 22.5, cy: -0.8, r: 1.5 },
  { cx: 27, cy: 0.9, r: 1.1 },
  { cx: 30.5, cy: -0.4, r: 0.8 }
] as const;

// A likeness faces the room, so sauce from its mouth would cross the face —
// and aimed up, hide it. A costumed bird's stream leaves the rim of its head
// instead, on the side it is aimed at, a little below the photo's middle
// where a jaw is: drawn under the head, it comes out from behind the face.
const COSTUME_SPRAY_CENTRE = { x: COSTUME_HEAD_ANCHORS.cx, y: COSTUME_HEAD_ANCHORS.top + COSTUME_HEAD_HEIGHT * 0.6 };

const COSTUME_SPRAY_RIM = 17;

/**
 * Where the stream leaves a head, in the head's own frame, for a stream turned
 * `turn` degrees in that frame: the drawn beak's tip, or a costume head's rim.
 */
export const resolveCharacterSauceOrigin = (costume: boolean, turn: number): { x: number; y: number } => {
  if (!costume) {
    return DRAWN_BEAK_TIP;
  }

  const radians = (turn * Math.PI) / 180;

  return {
    x: COSTUME_SPRAY_CENTRE.x + COSTUME_SPRAY_RIM * Math.cos(radians),
    y: COSTUME_SPRAY_CENTRE.y + COSTUME_SPRAY_RIM * Math.sin(radians)
  };
};

// The stream itself, laid at `x`,`y` and turned `turn` degrees: the figure
// puts it where `resolveCharacterSauceOrigin` says and takes off the turn the
// pose has already put on the head, so it points where `angle` says.
export const CharacterSauce = ({
  x,
  y,
  turn,
  tone = "mild"
}: {
  x: number;
  y: number;
  turn: number;
  tone?: CharacterSprayTone;
}): JSX.Element => {
  return (
    <g
      data-character-sauce={tone}
      className={tone === "hot" ? styles.hot : styles.mild}
      transform={`translate(${x} ${y}) rotate(${turn})`}
    >
      <path className={styles.jet} d={JET_PATH} />
      {DROPS.map((drop) => (
        <circle key={drop.cx} className={styles.jet} cx={drop.cx} cy={drop.cy} r={drop.r} />
      ))}
    </g>
  );
};
