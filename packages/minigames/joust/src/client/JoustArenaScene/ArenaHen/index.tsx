import { memo } from "react";
import type { JoustPlayerFigure, JoustVec2 } from "@wingnight/shared";
import { JOUST_PIN_HEIGHT } from "@wingnight/shared";
import {
  CHARACTER_FOOT,
  CHARACTER_STAND_HEIGHT,
  CharacterFigure,
  resolveCharacterFillClassName,
  resolvePlayerAppearance,
  resolveTeamApparel
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

/**
 * Stands the character's own frame up along the pin: its sole lands on the foot body and its head
 * on the head body. Built straight from the two body centres, so nothing here needs an angle — the
 * pin's lean IS the rotation, and recovering it as a number would only be a lossy way of asking
 * for what we already have.
 */
const standUpOnPin = (foot: JoustVec2, head: JoustVec2): string => {
  const alongX = head.x - foot.x;
  const alongY = head.y - foot.y;
  const length = Math.sqrt(alongX * alongX + alongY * alongY);
  // A pin squashed to nothing has no direction to stand in; hold it upright rather than collapse
  // the matrix to zeroes and vanish the bird.
  const upX = length === 0 ? 0 : alongX / length;
  const upY = length === 0 ? -1 : alongY / length;

  return `matrix(${-upY} ${upX} ${-upX} ${-upY} ${foot.x} ${foot.y})`;
};

const ArenaHenFigure = ({
  figure,
  foot,
  head,
  serverOrigin,
  facing,
  isDown = false
}: ArenaHenProps): JSX.Element => {
  const appearance = resolvePlayerAppearance(
    { name: figure.name, avatarSrc: figure.avatarSrc ?? undefined },
    serverOrigin
  );

  return (
    <g
      className={`${resolveCharacterFillClassName(figure.teamId)}${isDown ? ` ${styles.down}` : ""}`}
      transform={standUpOnPin(foot, head)}
      data-joust-hen={figure.name}
    >
      <title>{figure.name}</title>
      <g
        transform={`scale(${LANE_SCALE * facing} ${LANE_SCALE}) translate(${-CHARACTER_FOOT.x} ${-CHARACTER_FOOT.y})`}
      >
        <CharacterFigure
          appearance={appearance}
          apparel={resolveTeamApparel({ genre: figure.genre ?? undefined })}
        />
      </g>
    </g>
  );
};

const isSameVec = (a: JoustVec2, b: JoustVec2): boolean => a.x === b.x && a.y === b.y;

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
    previous.isDown === next.isDown
  );
});
