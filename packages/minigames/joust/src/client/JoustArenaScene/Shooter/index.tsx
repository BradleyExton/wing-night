import type { JoustFrame } from "@wingnight/shared";
import {
  JOUST_SHOOTER_BALL_INDICES,
  JOUST_SHOOTER_HEAD_INDEX,
  readJoustFramePosition,
  resolveJoustBodies
} from "@wingnight/shared";

import { joustPalette } from "../palette.js";

export type ShooterProps = {
  frame: JoustFrame;
};

const SHOOTER_BODIES = resolveJoustBodies(0);

const toPolyline = (frame: JoustFrame, fromIndex: number, toIndex: number): string => {
  const parts: string[] = [];

  for (let index = fromIndex; index <= toIndex; index += 1) {
    const position = readJoustFramePosition(frame, index);
    parts.push(`${index === fromIndex ? "M" : "L"}${position.x} ${position.y}`);
  }

  return parts.join(" ");
};

// The thing on the band: a shaft, a head and two balls, exactly as it always was. The rack it is
// fired at changed; the projectile is the joke that named the game.
export const Shooter = ({ frame }: ShooterProps): JSX.Element => {
  const shaftRadius = SHOOTER_BODIES[0]?.radius ?? 2;
  const head = readJoustFramePosition(frame, JOUST_SHOOTER_HEAD_INDEX);
  const headRadius = SHOOTER_BODIES[JOUST_SHOOTER_HEAD_INDEX]?.radius ?? 3;

  return (
    <g data-joust-shooter>
      {JOUST_SHOOTER_BALL_INDICES.map((ballIndex) => {
        const ball = readJoustFramePosition(frame, ballIndex);
        const radius = SHOOTER_BODIES[ballIndex]?.radius ?? 2;

        return (
          <circle
            key={ballIndex}
            cx={ball.x}
            cy={ball.y}
            r={radius}
            fill={joustPalette.shooter}
            stroke={joustPalette.shooterDark}
            strokeWidth={0.8}
          />
        );
      })}
      <path
        d={toPolyline(frame, 0, JOUST_SHOOTER_HEAD_INDEX)}
        fill="none"
        stroke={joustPalette.shooterDark}
        strokeWidth={shaftRadius * 2 + 1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={toPolyline(frame, 0, JOUST_SHOOTER_HEAD_INDEX)}
        fill="none"
        stroke={joustPalette.shooter}
        strokeWidth={shaftRadius * 2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={head.x}
        cy={head.y}
        r={headRadius}
        fill={joustPalette.shooter}
        stroke={joustPalette.shooterDark}
        strokeWidth={0.8}
      />
      <circle
        cx={head.x - 0.8}
        cy={head.y - 1}
        r={headRadius * 0.45}
        fill={joustPalette.shooterLight}
        opacity={0.55}
      />
      <circle cx={head.x + 1.1} cy={head.y - 0.7} r={0.95} fill={joustPalette.eye} />
      <circle cx={head.x - 0.9} cy={head.y - 0.7} r={0.95} fill={joustPalette.eye} />
      <circle cx={head.x + 1.35} cy={head.y - 0.6} r={0.45} fill={joustPalette.pupil} />
      <circle cx={head.x - 0.65} cy={head.y - 0.6} r={0.45} fill={joustPalette.pupil} />
    </g>
  );
};
