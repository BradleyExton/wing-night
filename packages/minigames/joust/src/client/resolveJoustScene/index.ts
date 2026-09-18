import type {
  JoustAim,
  JoustArena,
  JoustFrame,
  JoustMinigameArena,
  JoustMinigameShot,
  JoustPlayerFigure,
  JoustVec2
} from "@wingnight/shared";
import {
  JOUST_SHOOTER_HEAD_INDEX,
  readJoustFramePosition,
  resolveJoustRackSlots,
  resolveJoustRestFrame
} from "@wingnight/shared";

import { resolveStandingPins, type JoustStandingPin } from "../../runtime/lineup/index.js";

// How long a burst stays on a player who has just gone over, in track frames.
const IMPACT_FRAMES = 10;

/** How many frames of flight the shooter's ghost trail reaches back, at the track's own rate. */
export const JOUST_TRAIL_FRAMES = 8;

export type JoustScene = {
  frame: JoustFrame;
  // The players the frame's pin bodies belong to, in frame order.
  pins: JoustStandingPin[];
  // Players already on the sand before this frame's shot. They have no bodies in the track, so
  // the renderer lays them out flat on their own columns.
  fallen: JoustStandingPin[];
  // Pin indices to punch a burst on right now.
  burstPinIndices: number[];
  // Where the shooter's head was on the frames just before this one, oldest first. Empty on a
  // rest pose: nothing has flown yet.
  trail: JoustVec2[];
};

const toFallen = (
  arena: JoustMinigameArena,
  lineup: readonly JoustPlayerFigure[],
  presentPlayerIds: ReadonlySet<string>
): JoustStandingPin[] => {
  const slots = resolveJoustRackSlots(arena.perches, lineup.length);

  return lineup.flatMap((figure, slotIndex): JoustStandingPin[] => {
    const slot = slots[slotIndex];

    if (presentPlayerIds.has(figure.playerId) || slot === undefined) {
      return [];
    }

    return [{ ...figure, slotIndex, x: slot.x, y: slot.y }];
  });
};

/**
 * The one scene both surfaces draw: a track frame while a shot is on screen, otherwise the rest
 * pose for the current pull.
 *
 * A replaying track carries its OWN rack — the standing set as it was before that shot — because
 * the players it is in the act of felling are still on their feet in its early frames. Reading the
 * current standing set there would erase them mid-flight.
 */
export const resolveJoustScene = (
  arena: JoustMinigameArena,
  lineup: readonly JoustPlayerFigure[],
  downPlayerIds: readonly string[],
  aim: JoustAim,
  lastShot: JoustMinigameShot | null,
  replayIndex: number
): JoustScene => {
  const figureById = new Map(lineup.map((figure) => [figure.playerId, figure]));
  const slots = resolveJoustRackSlots(arena.perches, lineup.length);
  const slotIndexById = new Map(lineup.map((figure, index) => [figure.playerId, index]));
  const toArena = (pins: readonly JoustStandingPin[]): JoustArena => ({
    pinFeet: pins.map((pin) => ({ x: pin.x, y: pin.y })),
    perches: arena.perches,
    obstacles: arena.obstacles
  });

  if (lastShot === null) {
    const pins = resolveStandingPins(lineup, downPlayerIds, arena.perches);

    return {
      frame: resolveJoustRestFrame(toArena(pins), aim),
      pins,
      fallen: toFallen(arena, lineup, new Set(pins.map((pin) => pin.playerId))),
      burstPinIndices: [],
      trail: []
    };
  }

  const pins = lastShot.pinPlayerIds.flatMap((playerId): JoustStandingPin[] => {
    const figure = figureById.get(playerId);
    const slotIndex = slotIndexById.get(playerId);
    const slot = slotIndex === undefined ? undefined : slots[slotIndex];

    if (figure === undefined || slotIndex === undefined || slot === undefined) {
      return [];
    }

    return [{ ...figure, slotIndex, x: slot.x, y: slot.y }];
  });
  const clampedIndex = Math.max(0, Math.min(replayIndex, lastShot.run.keyframes.length - 1));
  const frame = lastShot.run.keyframes[clampedIndex] ?? resolveJoustRestFrame(toArena(pins), aim);

  return {
    frame,
    pins,
    fallen: toFallen(arena, lineup, new Set(lastShot.pinPlayerIds)),
    burstPinIndices: lastShot.run.topples
      .filter(
        (topple) =>
          clampedIndex >= topple.frameIndex && clampedIndex < topple.frameIndex + IMPACT_FRAMES
      )
      .map((topple) => topple.pinIndex),
    trail: lastShot.run.keyframes
      .slice(Math.max(0, clampedIndex - JOUST_TRAIL_FRAMES), clampedIndex)
      .map((flown) => readJoustFramePosition(flown, JOUST_SHOOTER_HEAD_INDEX))
  };
};

export const isReplayFinished = (
  lastShot: JoustMinigameShot | null,
  replayIndex: number
): boolean => {
  return lastShot === null || replayIndex >= lastShot.run.keyframes.length - 1;
};
