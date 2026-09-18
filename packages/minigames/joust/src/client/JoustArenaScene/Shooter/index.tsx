import type { JoustFrame, JoustVec2 } from "@wingnight/shared";
import {
  JOUST_SHOOTER_BALL_INDICES,
  JOUST_SHOOTER_HEAD_INDEX,
  readJoustFramePosition,
  resolveJoustBodies
} from "@wingnight/shared";
import { resolveSchlongFace, resolveSchlongPaths } from "@wingnight/cast";

import { joustPalette } from "../palette.js";

export type ShooterProps = {
  frame: JoustFrame;
  // Which way it is going, for the eyes; null at rest, when it eyes the rack.
  velocity: JoustVec2 | null;
};

const SHOOTER_BODIES = resolveJoustBodies(0);
const SHAFT_RADIUS = SHOOTER_BODIES[0]?.radius ?? 2;
const HEAD_RADIUS = SHOOTER_BODIES[JOUST_SHOOTER_HEAD_INDEX]?.radius ?? 3;
const OUTLINE_WIDTH = 0.9;
// At rest it eyes the rack down the lane; in flight it looks where it is going.
const DOWN_THE_LANE: JoustVec2 = { x: 400, y: 0 };

// The thing on the band, drawn as the cast's schlong along its own physics
// bodies: the five shaft links and the head are the spine, so every flop the
// integrator gives it is in the outline, and the glans is the head body's
// circle. The balls are the two bodies hung off the tail. It keeps the primary
// orange: it is the team's shot, and the desert has no other orange thing.
export const Shooter = ({ frame, velocity }: ShooterProps): JSX.Element => {
  const spine: JoustVec2[] = [];

  for (let index = 0; index <= JOUST_SHOOTER_HEAD_INDEX; index += 1) {
    spine.push(readJoustFramePosition(frame, index));
  }

  const paths = resolveSchlongPaths(spine, { shaftRadius: SHAFT_RADIUS, headRadius: HEAD_RADIUS });
  const lookAt =
    velocity === null || (velocity.x === 0 && velocity.y === 0)
      ? DOWN_THE_LANE
      : { x: paths.head.x + velocity.x * 100, y: paths.head.y + velocity.y * 100 };
  const face = resolveSchlongFace(paths.head, HEAD_RADIUS, lookAt);

  return (
    <g data-joust-shooter>
      {JOUST_SHOOTER_BALL_INDICES.map((ballIndex) => {
        const ball = readJoustFramePosition(frame, ballIndex);
        const radius = SHOOTER_BODIES[ballIndex]?.radius ?? 2;

        return (
          <g key={ballIndex}>
            <circle
              cx={ball.x}
              cy={ball.y}
              r={radius}
              fill={joustPalette.shooter}
              stroke={joustPalette.shooterDark}
              strokeWidth={OUTLINE_WIDTH}
            />
            <circle
              cx={ball.x - radius * 0.32}
              cy={ball.y - radius * 0.36}
              r={radius * 0.3}
              fill={joustPalette.shooterLight}
              opacity={0.7}
            />
          </g>
        );
      })}
      <path
        d={paths.body}
        fill={joustPalette.shooter}
        stroke={joustPalette.shooterDark}
        strokeWidth={OUTLINE_WIDTH}
        strokeLinejoin="round"
        data-joust-shooter-body
      />
      <path d={paths.gloss} fill={joustPalette.shooterLight} opacity={0.62} />
      <path
        d={paths.corona}
        fill="none"
        stroke={joustPalette.shooterDark}
        strokeWidth={0.65}
        strokeLinecap="round"
        opacity={0.85}
      />
      <path
        d={paths.slit}
        fill="none"
        stroke={joustPalette.shooterDark}
        strokeWidth={0.5}
        strokeLinecap="round"
        opacity={0.8}
      />
      <circle cx={face.leftEye.x} cy={face.leftEye.y} r={face.eyeRadius} fill={joustPalette.eye} />
      <circle cx={face.rightEye.x} cy={face.rightEye.y} r={face.eyeRadius} fill={joustPalette.eye} />
      <circle
        cx={face.leftEye.x + face.pupilOffset.x}
        cy={face.leftEye.y + face.pupilOffset.y}
        r={face.pupilRadius}
        fill={joustPalette.pupil}
      />
      <circle
        cx={face.rightEye.x + face.pupilOffset.x}
        cy={face.rightEye.y + face.pupilOffset.y}
        r={face.pupilRadius}
        fill={joustPalette.pupil}
      />
      <path
        d={face.mouth}
        fill="none"
        stroke={joustPalette.shooterDark}
        strokeWidth={0.4}
        strokeLinecap="round"
      />
    </g>
  );
};
