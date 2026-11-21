import { BORDEN_WORLD, type BordenBottleDrop, type BordenFrame } from "@wingnight/shared";

import { BORDEN_GROUND_Y, round2, toScreenY } from "../frameGeometry.js";
import { bordenNight as ink } from "../palette.js";

const BOTTLE_INK: Record<BordenBottleDrop["bottle"], string> = { spread: ink.spread, long: ink.long, puddle: ink.hot };

/**
 * The hot bottle lying in the stretch, bobbing so it reads as a pickup: a squeeze bottle with a
 * nozzle, in its own colour, and three dots for the spread's three streams.
 */
export const BottleDrop = ({ drop, tick }: { drop: BordenBottleDrop; tick: number }): JSX.Element => {
  const lift = round2(2 + Math.sin(tick / 9) * 1.2);
  const bottom = BORDEN_GROUND_Y - lift;

  return (
    <g data-borden-bottle={drop.bottle} data-borden-x={round2(drop.x)}>
      <ellipse cx={drop.x} cy={BORDEN_GROUND_Y + 0.4} rx={3} ry={0.8} fill={ink.shadow} />
      <rect x={drop.x - 2} y={round2(bottom - 7)} width={4} height={7} rx={1.2} fill={BOTTLE_INK[drop.bottle]} stroke={ink.inkDark} strokeWidth={0.3} />
      <rect x={drop.x - 1.2} y={round2(bottom - 5)} width={2.4} height={2.6} rx={0.4} fill={ink.ink} opacity={0.85} />
      <path d={`M ${drop.x - 0.8} ${round2(bottom - 7)} L ${drop.x} ${round2(bottom - 9.5)} L ${drop.x + 0.8} ${round2(bottom - 7)} Z`} fill={ink.ink} />
    </g>
  );
};

/** Every shot in the air: a hot round, or the tank's big slow shell with a dark core. */
export const Shots = ({ shots }: { shots: BordenFrame["shots"] }): JSX.Element => (
  <g>
    {shots.map((shot) => (
      <g key={shot.id} data-borden-shot={shot.id} data-borden-shot-level={shot.y < BORDEN_WORLD.highShotHeight ? "low" : "high"}>
        <ellipse cx={round2(shot.x - Math.sign(shot.vx) * shot.radius)} cy={toScreenY(shot.y)} rx={shot.radius * 1.6} ry={shot.radius * 0.5} fill={ink.shot} opacity={0.35} />
        <circle cx={round2(shot.x)} cy={toScreenY(shot.y)} r={shot.radius} fill={shot.radius > BORDEN_WORLD.shotRadius ? ink.shell : ink.shot} />
        <circle cx={round2(shot.x)} cy={toScreenY(shot.y)} r={round2(shot.radius * 0.45)} fill={ink.inkDark} opacity={shot.radius > BORDEN_WORLD.shotRadius ? 0.6 : 0} />
      </g>
    ))}
  </g>
);

/** The sauce in flight: each drop in its hen's bottle's heat. */
export const Sauce = ({ frame }: { frame: BordenFrame }): JSX.Element => (
  <g>
    {frame.sauce.map((drop) => {
      const isMild = frame.hens[drop.hen]?.bottle === "mild";

      return <circle key={drop.id} cx={round2(drop.x)} cy={toScreenY(drop.y)} r={BORDEN_WORLD.sauceRadius} fill={isMild ? ink.mild : ink.hot} />;
    })}
  </g>
);

/** The puddle bottle's splashes on the ground, fading as they burn out. */
export const Puddles = ({ frame }: { frame: BordenFrame }): JSX.Element => (
  <g>
    {frame.puddles.map((puddle) => (
      <ellipse
        key={puddle.id}
        data-borden-puddle={puddle.id}
        cx={round2(puddle.x)}
        cy={BORDEN_GROUND_Y + 0.3}
        rx={BORDEN_WORLD.puddleHalfWidth}
        ry={1.4}
        fill={ink.puddle}
        opacity={round2(Math.min(1, (puddle.untilTick - frame.tick) / 30))}
      />
    ))}
  </g>
);

/**
 * The gate at the far end: two posts either side of the gate line, a striped boom and the sign
 * over it. Reaching the line clears the stretch; on the last stretch it is the base's main gate.
 * It is narrow, because the camera stops with the line near the window's right edge.
 */
export const Gate = ({ x, label, className }: { x: number; label: string; className: string }): JSX.Element => (
  <g data-borden-gate={round2(x)}>
    <rect x={x - 7} y={BORDEN_GROUND_Y - 28} width={1.6} height={28} fill={ink.steel} />
    <rect x={x + 5.4} y={BORDEN_GROUND_Y - 28} width={1.6} height={28} fill={ink.steel} />
    <rect x={x - 9} y={BORDEN_GROUND_Y - 35} width={18} height={7} rx={1} fill={ink.gate} />
    <text className={className} x={x} y={BORDEN_GROUND_Y - 31.4} textAnchor="middle" dominantBaseline="central" fill={ink.inkDark}>
      {label}
    </text>
    {[0, 1, 2, 3].map((index) => (
      <rect key={index} x={x - 5.4 + index * 2.7} y={BORDEN_GROUND_Y - 13} width={2.7} height={1.8} fill={index % 2 === 0 ? ink.stripe : ink.ink} opacity={0.9} />
    ))}
  </g>
);
