import type { JoustMinigameShot, JoustShotGhost, JoustVec2 } from "@wingnight/shared";
import { JOUST_SHOOTER_HEAD_INDEX, readJoustFramePosition } from "@wingnight/shared";

/**
 * A ghost only wants the FLIGHT: the head's arc from the band to whatever it first hit. Past
 * that the track is a tumble down the lane, and a dotted line following it is noise over the
 * rack. The arc ends where the head first turns back or comes level with the floor.
 */
const isFlightOver = (previous: JoustVec2, current: JoustVec2, floorY: number): boolean => {
  return current.x < previous.x || current.y >= floorY;
};

export const resolveShotGhost = (shot: JoustMinigameShot, floorY: number): JoustShotGhost => {
  const path: JoustVec2[] = [];

  for (const frame of shot.run.keyframes) {
    const head = readJoustFramePosition(frame, JOUST_SHOOTER_HEAD_INDEX);
    const previous = path[path.length - 1];

    if (previous !== undefined && isFlightOver(previous, head, floorY)) {
      break;
    }

    path.push(head);
  }

  return {
    shotNumber: shot.shotNumber,
    aim: { x: shot.aim.x, y: shot.aim.y },
    path
  };
};
