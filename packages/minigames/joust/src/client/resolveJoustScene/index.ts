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

/**
 * The frame at a fractional replay index: the two keyframes either side of it, blended. A
 * track is sampled at 24 Hz and a screen paints at 60 or 120, so this is what makes a flight
 * move every frame instead of every third one. Body order is the same in every frame of a
 * track, so blending position by position is blending body by body.
 */
const blendFrames = (keyframes: readonly JoustFrame[], index: number): JoustFrame | undefined => {
  const lower = Math.floor(index);
  const upper = Math.min(lower + 1, keyframes.length - 1);
  const from = keyframes[lower];
  const to = keyframes[upper];
  const mix = index - lower;

  if (from === undefined || to === undefined || mix <= 0 || from === to) {
    return from;
  }

  return from.map((value, position) => value + ((to[position] ?? value) - value) * mix);
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
  const frame =
    blendFrames(lastShot.run.keyframes, clampedIndex) ?? resolveJoustRestFrame(toArena(pins), aim);
  // Bursts and the trail are counted in whole keyframes: the last one fully reached.
  const reachedIndex = Math.floor(clampedIndex);

  return {
    frame,
    pins,
    fallen: toFallen(arena, lineup, new Set(lastShot.pinPlayerIds)),
    burstPinIndices: lastShot.run.topples
      .filter(
        (topple) =>
          reachedIndex >= topple.frameIndex && reachedIndex < topple.frameIndex + IMPACT_FRAMES
      )
      .map((topple) => topple.pinIndex),
    trail: lastShot.run.keyframes
      .slice(Math.max(0, reachedIndex - JOUST_TRAIL_FRAMES), reachedIndex)
      .map((flown) => readJoustFramePosition(flown, JOUST_SHOOTER_HEAD_INDEX))
  };
};

export const isReplayFinished = (
  lastShot: JoustMinigameShot | null,
  replayIndex: number
): boolean => {
  return lastShot === null || replayIndex >= lastShot.run.keyframes.length - 1;
};
