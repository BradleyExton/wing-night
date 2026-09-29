import { forwardRef, useImperativeHandle, useRef } from "react";
import { CHARACTER_RIDE_STANCE } from "@wingnight/cast";

import { schlonicPalette } from "../palette.js";

export type SkateboardHandle = {
  /** Turn the board about its long axis: 0 wheels down, 90 its underside to the room, 180 wheels up. */
  roll: (degrees: number) => void;
};

// The board, in the cast figure's own 80×72 units, so it lies exactly under a `ride` pose: the
// deck's top on the stance's `deckY`, a truck under each foot. The board is a little longer than
// the stance's own reach — a kicktail and a nose turned up past each foot — because the upturned
// ends are what make a plank read as a skateboard from the sofa.
const { deckY, backFootX, frontFootX, deckFromX, deckToX } = CHARACTER_RIDE_STANCE;

export const DECK_THICKNESS = 4;
const GRIP_THICKNESS = 1.7;
const TRUCK_DEPTH = 2.8;
export const WHEEL_RADIUS = 3.6;
/** From the deck's top to the bottom of the wheels: how far the board lifts the hen off the ground. */
export const BOARD_DEPTH = DECK_THICKNESS + TRUCK_DEPTH + WHEEL_RADIUS * 2;
/** The line the board rolls about in a kickflip: half way down it, so nothing pokes above the deck. */
export const BOARD_ROLL_Y = deckY + BOARD_DEPTH / 2;
/** The two trucks, one under each foot. */
export const TRUCK_XS = [backFootX, frontFootX] as const;

const TAIL_REACH = 6;
const TAIL_RISE = 4.8;
const DECK_FROM_X = deckFromX - TAIL_REACH;
const DECK_TO_X = deckToX + TAIL_REACH;
const DECK_MID_Y = deckY + DECK_THICKNESS / 2;
/** The deck's side, as one centreline stroked thick: flat between the trucks, turned up at both ends. */
const DECK_PATH = `M ${DECK_FROM_X} ${DECK_MID_Y - TAIL_RISE} Q ${deckFromX} ${DECK_MID_Y} ${deckFromX + 5} ${DECK_MID_Y} L ${
  deckToX - 5
} ${DECK_MID_Y} Q ${deckToX} ${DECK_MID_Y} ${DECK_TO_X} ${DECK_MID_Y - TAIL_RISE}`;
const OUTLINE = 1.1;
/** The deck seen flat on, mid-flip: as wide as a real deck is against its length. */
const FACE_WIDTH = 14;
const FACE_TOP = BOARD_ROLL_Y - FACE_WIDTH / 2;

const Truck = ({ x }: { x: number }): JSX.Element => {
  const top = deckY + DECK_THICKNESS;

  return (
    <g>
      <path
        d={`M ${x - 3.4} ${top} L ${x + 3.4} ${top} L ${x + 2} ${top + TRUCK_DEPTH} L ${x - 2} ${top + TRUCK_DEPTH} Z`}
        fill={schlonicPalette.truck}
        stroke={schlonicPalette.boardInk}
        strokeWidth={0.7}
        strokeLinejoin="round"
      />
      <circle
        cx={x}
        cy={top + TRUCK_DEPTH + WHEEL_RADIUS}
        r={WHEEL_RADIUS}
        fill={schlonicPalette.wheel}
        stroke={schlonicPalette.boardInk}
        strokeWidth={0.9}
      />
      <circle cx={x} cy={top + TRUCK_DEPTH + WHEEL_RADIUS} r={1.1} fill={schlonicPalette.wheelHub} />
    </g>
  );
};

/** The side view: the deck's edge (grip over maple), the trucks and the near wheels. */
const Profile = (): JSX.Element => (
  <g>
    {TRUCK_XS.map((x) => (
      <Truck key={x} x={x} />
    ))}
    <path d={DECK_PATH} fill="none" stroke={schlonicPalette.boardInk} strokeWidth={DECK_THICKNESS + OUTLINE * 2} strokeLinecap="round" />
    <path d={DECK_PATH} fill="none" stroke={schlonicPalette.ply} strokeWidth={DECK_THICKNESS} strokeLinecap="round" />
    <path
      d={DECK_PATH}
      transform={`translate(0 ${-(DECK_THICKNESS - GRIP_THICKNESS) / 2})`}
      fill="none"
      stroke={schlonicPalette.grip}
      strokeWidth={GRIP_THICKNESS}
      strokeLinecap="round"
    />
  </g>
);

const faceOutline = (
  <rect
    x={DECK_FROM_X}
    y={FACE_TOP}
    width={DECK_TO_X - DECK_FROM_X}
    height={FACE_WIDTH}
    rx={FACE_WIDTH / 2}
    stroke={schlonicPalette.boardInk}
    strokeWidth={OUTLINE * 1.4}
  />
);

/** The underside, flat on: the team's own graphic, with the trucks across it and a wheel at each corner. */
const Underside = (): JSX.Element => (
  <g>
    {TRUCK_XS.map((x) => (
      <g key={x}>
        <rect x={x - 1.6} y={FACE_TOP - 2.6} width={3.2} height={FACE_WIDTH + 5.2} rx={1.2} fill={schlonicPalette.wheel} stroke={schlonicPalette.boardInk} strokeWidth={0.7} />
      </g>
    ))}
    <g fill="currentColor">{faceOutline}</g>
    {/* A flash down the middle, so the reveal reads as a graphic and not a painted plank. */}
    <path
      d={`M ${DECK_FROM_X + 8} ${BOARD_ROLL_Y + 3} L ${(DECK_FROM_X + DECK_TO_X) / 2 + 2} ${BOARD_ROLL_Y - 3.4} L ${
        (DECK_FROM_X + DECK_TO_X) / 2 - 1
      } ${BOARD_ROLL_Y + 0.6} L ${DECK_TO_X - 8} ${BOARD_ROLL_Y - 3}`}
      fill="none"
      stroke={schlonicPalette.deckFlash}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {TRUCK_XS.map((x) => (
      <rect key={x} x={x - 1.2} y={FACE_TOP + 1.2} width={2.4} height={FACE_WIDTH - 2.4} rx={1} fill={schlonicPalette.truck} stroke={schlonicPalette.boardInk} strokeWidth={0.6} />
    ))}
  </g>
);

/** The top, flat on: black grip tape and the four bolts over each truck. */
const GripSide = (): JSX.Element => (
  <g>
    <g fill={schlonicPalette.grip}>{faceOutline}</g>
    {TRUCK_XS.flatMap((x) =>
      [-1.6, 1.6].map((dx) =>
        [-2.2, 2.2].map((dy) => (
          <circle key={`${x}${dx}${dy}`} cx={x + dx} cy={BOARD_ROLL_Y + dy} r={0.55} fill={schlonicPalette.truck} />
        ))
      )
    )}
  </g>
);

const scaleAboutRoll = (share: number): string =>
  `translate(0 ${BOARD_ROLL_Y}) scale(1 ${share}) translate(0 ${-BOARD_ROLL_Y})`;

/**
 * The runner's board (DESIGN.md §2.11): a deck with a kicktail and a nose, black grip on top,
 * maple at the edge, a truck and a wheel under each foot — and underneath, in the team's own
 * colour (`currentColor`, from the group that places it), the graphic the kickflip shows off.
 * A side-on flip is drawn as the two things a side view can see of a board turning over: its
 * edge, squashing as it turns, and its flat face, opening up as the edge closes.
 */
export const Skateboard = forwardRef<SkateboardHandle>((_props, ref): JSX.Element => {
  const profile = useRef<SVGGElement>(null);
  const underside = useRef<SVGGElement>(null);
  const gripSide = useRef<SVGGElement>(null);

  useImperativeHandle(ref, () => ({
    roll: (degrees): void => {
      const radians = (degrees * Math.PI) / 180;
      const edge = Math.cos(radians);
      const face = Math.sin(radians);
      const isFaceShown = Math.abs(face) > 0.3;

      profile.current?.setAttribute("transform", scaleAboutRoll(edge));
      profile.current?.setAttribute("opacity", Math.abs(edge) > 0.15 ? "1" : "0");
      underside.current?.setAttribute("transform", scaleAboutRoll(Math.abs(face)));
      underside.current?.setAttribute("opacity", isFaceShown && face > 0 ? "1" : "0");
      gripSide.current?.setAttribute("transform", scaleAboutRoll(Math.abs(face)));
      gripSide.current?.setAttribute("opacity", isFaceShown && face < 0 ? "1" : "0");
    }
  }));

  return (
    <g data-schlonic-skateboard>
      <g ref={profile}>
        <Profile />
      </g>
      <g ref={underside} opacity={0}>
        <Underside />
      </g>
      <g ref={gripSide} opacity={0}>
        <GripSide />
      </g>
    </g>
  );
});

Skateboard.displayName = "Skateboard";
