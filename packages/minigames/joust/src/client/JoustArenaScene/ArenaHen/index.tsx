import { memo } from "react";
import type { JoustPlayerFigure, JoustVec2 } from "@wingnight/shared";
import { JOUST_PIN_HEIGHT } from "@wingnight/shared";
import {
  CHARACTER_FOOT,
  CHARACTER_STAND_HEIGHT,
  CHARACTER_WING_ROOT,
  CharacterFigure,
  resolveCharacterFillClassName,
  resolveCharacterWingPath,
  resolvePlayerAppearance,
  resolveTeamApparel,
  resolveTeamSilhouette,
  type CharacterPose
} from "@wingnight/cast";

import * as styles from "./styles.js";

export type ArenaHenProps = {
  figure: JoustPlayerFigure;
  foot: JoustVec2;
  head: JoustVec2;
  serverOrigin: string | null;
  // The lane's own birds face the incoming shot; the bench behind the slingshot faces down it.
  facing: 1 | -1;
  // Felled on an earlier shot: still themselves, just spent.
  isDown?: boolean;
  // What the parts are doing (the cast's `CHARACTER_POSES`); a pin's bird stands `still`.
  pose?: CharacterPose;
  // A point in the WORLD the bird is reaching for — the band, when it is the shooter's hand on
  // it. The figure is drawn without its wing and one goes on its own layer, turned about the
  // shoulder to point there, the way FAPPY beats its wing over a bird that never repaints.
  wingAimAt?: JoustVec2 | null;
};

/**
 * The cast bird (§2.8) standing on a JOUST pin. It is the SAME drawing as the setup lobby's — the
 * package exports the figure as a bare `<g>` precisely so it can be dropped in here — which is why
 * a player's generated head arrives for free, and why a redraw would have been the wrong answer.
 *
 * `CHARACTER_STAND_HEIGHT` is what ties the two together: the figure is scaled so its sole-to-head
 * height IS the pin's, so the bird the room sees hit is the capsule the integrator hit.
 */
const LANE_SCALE = JOUST_PIN_HEIGHT / CHARACTER_STAND_HEIGHT;

// The wing at rest hangs from the shoulder back and down toward the tail; this is the direction
// it hangs in, in the bird's own box, so a turn of zero is the wing exactly as the cast draws it.
const WING_REST_ANGLE_DEG = (Math.atan2(50 - CHARACTER_WING_ROOT.y, 22 - CHARACTER_WING_ROOT.x) * 180) / Math.PI;

type Upright = { upX: number; upY: number };

// Which way is up for this pin: from the foot body to the head body. A pin squashed to nothing has
// no direction to stand in; hold it upright rather than collapse the matrix to zeroes and vanish
// the bird.
const resolveUpright = (foot: JoustVec2, head: JoustVec2): Upright => {
  const alongX = head.x - foot.x;
  const alongY = head.y - foot.y;
  const length = Math.sqrt(alongX * alongX + alongY * alongY);

  return length === 0 ? { upX: 0, upY: -1 } : { upX: alongX / length, upY: alongY / length };
};

/**
 * Stands the character's own frame up along the pin: its sole lands on the foot body and its head
 * on the head body. Built straight from the two body centres, so nothing here needs an angle — the
 * pin's lean IS the rotation, and recovering it as a number would only be a lossy way of asking
 * for what we already have.
 */
const standUpOnPin = (foot: JoustVec2, { upX, upY }: Upright): string =>
  `matrix(${-upY} ${upX} ${-upX} ${-upY} ${foot.x} ${foot.y})`;

/**
 * How far to turn the wing about its shoulder so it points at a world point: the point is
 * carried back through the stand-up matrix and the lane scale into the bird's own box, where the
 * shoulder is a fixed pivot, and the angle is measured from the wing's resting hang.
 */
const resolveWingTurnDeg = (
  foot: JoustVec2,
  { upX, upY }: Upright,
  facing: 1 | -1,
  target: JoustVec2
): number => {
  const dx = target.x - foot.x;
  const dy = target.y - foot.y;
  // The stand-up matrix is a rotation, so its inverse is its transpose.
  const alongX = -upY * dx + upX * dy;
  const alongY = -upX * dx - upY * dy;
  const boxX = alongX / (LANE_SCALE * facing) + CHARACTER_FOOT.x;
  const boxY = alongY / LANE_SCALE + CHARACTER_FOOT.y;
  const reachDeg =
    (Math.atan2(boxY - CHARACTER_WING_ROOT.y, boxX - CHARACTER_WING_ROOT.x) * 180) / Math.PI;

  // The shortest way round, so a reach straight back reads as the small lift it is.
  return ((((reachDeg - WING_REST_ANGLE_DEG) % 360) + 540) % 360) - 180;
};

const ArenaHenFigure = ({
  figure,
  foot,
  head,
  serverOrigin,
  facing,
  isDown = false,
  pose = "still",
  wingAimAt = null
}: ArenaHenProps): JSX.Element => {
  const appearance = resolvePlayerAppearance(
    { name: figure.name, avatarSrc: figure.avatarSrc ?? undefined },
    serverOrigin
  );
  const silhouette = resolveTeamSilhouette({ genre: figure.genre ?? undefined });
  const upright = resolveUpright(foot, head);

  return (
    <g
      className={`${resolveCharacterFillClassName(figure.teamId)}${isDown ? ` ${styles.down}` : ""}`}
      transform={standUpOnPin(foot, upright)}
      data-joust-hen={figure.name}
    >
      <title>{figure.name}</title>
      <g
        transform={`scale(${LANE_SCALE * facing} ${LANE_SCALE}) translate(${-CHARACTER_FOOT.x} ${-CHARACTER_FOOT.y})`}
      >
        <CharacterFigure
          appearance={appearance}
          apparel={resolveTeamApparel({ genre: figure.genre ?? undefined })}
          silhouette={silhouette}
          pose={pose}
          wing={wingAimAt === null ? "drawn" : "none"}
        />
        {wingAimAt !== null && (
          <g
            transform={`rotate(${resolveWingTurnDeg(foot, upright, facing, wingAimAt).toFixed(1)} ${CHARACTER_WING_ROOT.x} ${CHARACTER_WING_ROOT.y})`}
            data-joust-wing
          >
            <path className={styles.wingInk} d={resolveCharacterWingPath(silhouette)} />
          </g>
        )}
      </g>
    </g>
  );
};

const isSameVec = (a: JoustVec2 | null, b: JoustVec2 | null): boolean =>
  a === b || (a !== null && b !== null && a.x === b.x && a.y === b.y);

// A replay now paints on every screen frame, and most of the rack is standing still through
// most of it: skip the birds whose bodies have not moved. The figure is compared by identity
// fields rather than reference because the scene resolver rebuilds its pin objects each call.
export const ArenaHen = memo(ArenaHenFigure, (previous, next): boolean => {
  return (
    previous.figure.playerId === next.figure.playerId &&
    previous.figure.name === next.figure.name &&
    previous.figure.avatarSrc === next.figure.avatarSrc &&
    previous.figure.teamId === next.figure.teamId &&
    previous.figure.genre === next.figure.genre &&
    isSameVec(previous.foot, next.foot) &&
    isSameVec(previous.head, next.head) &&
    previous.serverOrigin === next.serverOrigin &&
    previous.facing === next.facing &&
    previous.isDown === next.isDown &&
    previous.pose === next.pose &&
    isSameVec(previous.wingAimAt ?? null, next.wingAimAt ?? null)
  );
});
