import { memo } from "react";
import type { BordenStretchName } from "@wingnight/shared";

import { bordenNight as ink } from "../palette.js";
import { BORDEN_GROUND_Y } from "../frameGeometry.js";

/** How far past the stretch's ends the base is drawn, so a wide screen never shows its edge. */
const OVERRUN = 200;
/** The far layer moves at this share of the camera: it is a long way back. */
export const BORDEN_FAR_PARALLAX = 0.35;

const span = (from: number, to: number, every: number): number[] => {
  const out: number[] = [];

  for (let x = Math.floor(from / every) * every; x <= to; x += every) {
    out.push(x);
  }

  return out;
};

/** The base's buildings on the skyline: long huts with a few lit windows, and a hangar now and then. */
const FarLine = ({ length }: { length: number }): JSX.Element => {
  const to = length * BORDEN_FAR_PARALLAX + OVERRUN + 160;

  return (
    <g>
      {span(-OVERRUN, to, 64).map((x, index) =>
        index % 3 === 1 ? (
          <g key={x}>
            <path d={`M ${x} ${BORDEN_GROUND_Y} V 46 Q ${x + 24} 30 ${x + 48} 46 V ${BORDEN_GROUND_Y} Z`} fill={ink.far} />
            <path d={`M ${x + 14} ${BORDEN_GROUND_Y} V 52 H ${x + 34} V ${BORDEN_GROUND_Y}`} fill={ink.farLine} />
          </g>
        ) : (
          <g key={x}>
            <rect x={x} y={54} width={52} height={BORDEN_GROUND_Y - 54} fill={ink.far} />
            <path d={`M ${x - 2} 54 L ${x + 26} 48 L ${x + 54} 54 Z`} fill={ink.farLine} />
            {[8, 20, 32, 44].map((dx) => (
              <rect key={dx} x={x + dx - 2} y={60} width={4} height={3} fill={(x / 64 + dx) % 3 === 0 ? ink.window : ink.farLine} />
            ))}
          </g>
        )
      )}
    </g>
  );
};

/** The fences: chain link along the back, barbed wire on top, a watchtower every so often. */
const Fences = ({ length }: { length: number }): JSX.Element => (
  <g>
    <rect x={-OVERRUN} y={58} width={length + OVERRUN * 2} height={BORDEN_GROUND_Y - 58} fill={ink.fence} opacity={0.22} />
    {span(-OVERRUN, length + OVERRUN, 6).map((x) => (
      <path key={x} d={`M ${x} 58 L ${x + 6} ${BORDEN_GROUND_Y} M ${x + 6} 58 L ${x} ${BORDEN_GROUND_Y}`} stroke={ink.fence} strokeWidth={0.25} opacity={0.6} />
    ))}
    <path d={`M ${-OVERRUN} 58 H ${length + OVERRUN}`} stroke={ink.wire} strokeWidth={0.6} />
    <path
      d={span(-OVERRUN, length + OVERRUN, 3)
        .map((x, index) => `${index === 0 ? "M" : "L"} ${x} ${index % 2 === 0 ? 55.5 : 54}`)
        .join(" ")}
      fill="none"
      stroke={ink.wire}
      strokeWidth={0.3}
    />
    {span(-OVERRUN, length + OVERRUN, 24).map((x) => (
      <rect key={x} x={x - 0.6} y={53} width={1.2} height={BORDEN_GROUND_Y - 53} fill={ink.steel} />
    ))}
    {span(40, length, 150).map((x) => (
      <g key={x}>
        <path d={`M ${x - 6} ${BORDEN_GROUND_Y} L ${x - 3} 34 M ${x + 6} ${BORDEN_GROUND_Y} L ${x + 3} 34 M ${x - 5} 60 L ${x + 5} 46 M ${x + 5} 60 L ${x - 5} 46`} stroke={ink.steel} strokeWidth={0.8} />
        <rect x={x - 6} y={27} width={12} height={8} fill={ink.steelDark} />
        <path d={`M ${x - 8} 27 L ${x} 22 L ${x + 8} 27 Z`} fill={ink.steel} />
        <rect x={x - 4} y={29} width={8} height={3} fill={ink.window} />
      </g>
    ))}
  </g>
);

/** The motor pool: trucks parked nose to tail along the back, and the drums between them. */
const MotorPool = ({ length }: { length: number }): JSX.Element => (
  <g>
    {span(-OVERRUN, length + OVERRUN, 56).map((x) => (
      <g key={x}>
        <rect x={x} y={56} width={30} height={14} rx={1} fill={ink.oliveDark} />
        <rect x={x + 30} y={61} width={11} height={9} rx={1.5} fill={ink.oliveDark} />
        <rect x={x + 33} y={62.5} width={6} height={3.5} fill={ink.window} />
        {[6, 24, 36].map((dx) => (
          <circle key={dx} cx={x + dx} cy={71.5} r={3} fill={ink.steelDark} />
        ))}
        <rect x={x + 46} y={66} width={4} height={10} rx={0.6} fill={ink.steel} opacity={0.7} />
      </g>
    ))}
  </g>
);

/** The parade square: flagpoles down its length, the paint on the asphalt, the stand at the far end. */
const ParadeSquare = ({ length }: { length: number }): JSX.Element => (
  <g>
    {span(30, length + OVERRUN, 80).map((x) => (
      <g key={x}>
        <rect x={x - 0.5} y={28} width={1} height={BORDEN_GROUND_Y - 28} fill={ink.steel} />
        <path d={`M ${x + 0.5} 29 Q ${x + 6} 27 ${x + 11} 30 L ${x + 11} 36 Q ${x + 6} 33 ${x + 0.5} 35 Z`} fill={ink.flag} />
      </g>
    ))}
    <g transform={`translate(${length - 70} 0)`}>
      <rect x={0} y={60} width={34} height={BORDEN_GROUND_Y - 60} fill={ink.steelDark} />
      <rect x={-2} y={57} width={38} height={3} fill={ink.steel} />
      {[0, 4, 8].map((step) => (
        <rect key={step} x={step} y={64 + step} width={34 - step * 2} height={1} fill={ink.steel} opacity={0.6} />
      ))}
    </g>
  </g>
);

const NEAR: Record<BordenStretchName, ({ length }: { length: number }) => JSX.Element> = {
  fences: Fences,
  "motor-pool": MotorPool,
  "parade-square": ParadeSquare
};

/** The ground the hens run on: asphalt with its edge, and the parade square's painted lines. */
const Ground = ({ length, name }: { length: number; name: BordenStretchName }): JSX.Element => (
  <g>
    <rect x={-OVERRUN} y={BORDEN_GROUND_Y} width={length + OVERRUN * 2} height={60} fill={ink.ground} />
    <rect x={-OVERRUN} y={BORDEN_GROUND_Y} width={length + OVERRUN * 2} height={0.8} fill={ink.groundLine} />
    {name === "parade-square" &&
      span(0, length, 16).map((x) => <rect key={x} x={x} y={BORDEN_GROUND_Y + 5} width={8} height={0.8} fill={ink.paint} />)}
    {name !== "parade-square" &&
      span(-OVERRUN, length + OVERRUN, 22).map((x) => (
        <rect key={x} x={x} y={BORDEN_GROUND_Y + 3 + ((x / 22) % 3)} width={2.5} height={0.5} fill={ink.groundLine} opacity={0.6} />
      ))}
  </g>
);

/** The far skyline, slid at its parallax by the scene. Drawn once a stretch. */
export const BordenFar = memo(({ length }: { length: number }): JSX.Element => <FarLine length={length} />);

BordenFar.displayName = "BordenFar";

/** The stretch's own kit and its ground, in world units along the stretch. Drawn once a stretch. */
export const BordenNear = memo(({ length, name }: { length: number; name: BordenStretchName }): JSX.Element => {
  const Kit = NEAR[name];

  return (
    <g data-borden-stretch-name={name}>
      <Kit length={length} />
      <Ground length={length} name={name} />
    </g>
  );
});

BordenNear.displayName = "BordenNear";
