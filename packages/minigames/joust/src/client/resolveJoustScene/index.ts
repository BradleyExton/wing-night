import type {
  JoustAim,
  JoustArena,
  JoustFrame,
  JoustMinigameArena,
  JoustMinigameShot,
  JoustPlayerFigure,
  JoustShooterView,
  JoustShotGhost,
  JoustVec2
} from "@wingnight/shared";
import {
  JOUST_PIN_FOOT_RADIUS,
  JOUST_SHOOTER_HEAD_INDEX,
  JOUST_STANDARD_SHOOTER_PROFILE,
  JOUST_WORLD,
  joustLegFootIndex,
  joustLegTopIndex,
  readJoustFramePosition,
  resolveJoustLegs,
  resolveJoustPinPerchIndex,
  resolveJoustRackSlots,
  resolveJoustRestFrame
} from "@wingnight/shared";

import { resolveStandingPins, type JoustStandingPin } from "../../runtime/lineup/index.js";

// How long a burst stays on a player who has just gone over, in track frames.
const IMPACT_FRAMES = 10;
// How long the dust hangs over a tower that has just folded.
const COLLAPSE_FRAMES = 14;

/** How many frames of flight the shooter's ghost trail reaches back, at the track's own rate. */
export const JOUST_TRAIL_FRAMES = 8;

/** One tower leg at one instant: where its foot and top are, and whose slab it holds up. */
export type JoustSceneLeg = {
  perchIndex: number;
  foot: JoustVec2;
  top: JoustVec2;
};

export type JoustScene = {
  frame: JoustFrame;
  // The players the frame's pin bodies belong to, in frame order.
  pins: JoustStandingPin[];
  // Players already on the sand before this frame's shot. They have no bodies in the track, so
  // the renderer lays them out flat on their own columns — or on the sand below, if their tower
  // has since come down.
  fallen: JoustStandingPin[];
  // Every leg with a body in the frame, standing or folding, in frame order.
  legs: JoustSceneLeg[];
  // Towers already down before this frame's shot: no bodies, drawn as rubble.
  rubblePerchIndices: number[];
  // Pin indices to punch a burst on right now.
  burstPinIndices: number[];
  // Perch indices whose tower is folding right now.
  collapsingPerchIndices: number[];
  // Where the shooter's head was on the frames just before this one, oldest first. Empty on a
  // rest pose: nothing has flown yet.
  trail: JoustVec2[];
  // The previous shot's arc and pull, only while a fresh band is being aimed.
  ghost: JoustShotGhost | null;
  // The kind to draw on the band: the one that flew while a track replays, otherwise the one
  // loaded for the next pull. Null when the view carries no loadout at all.
  shooter: JoustShooterView | null;
};

export type JoustSceneInput = {
  arena: JoustMinigameArena;
  lineup: readonly JoustPlayerFigure[];
  downPlayerIds: readonly string[];
  collapsedPerchIndices: readonly number[];
  aim: JoustAim;
  lastShot: JoustMinigameShot | null;
  replayIndex: number;
  previousShotGhost: JoustShotGhost | null;
  // The turn's loadout and what is on the band. Both default to empty and Standard, so a caller
  // with no loadout to speak of draws exactly what it always drew.
  shooters?: readonly JoustShooterView[];
  selectedShooterId?: string | null;
};

const findShooter = (
  shooters: readonly JoustShooterView[],
  shooterId: string | null | undefined
): JoustShooterView | null => {
  return shooters.find((kind) => kind.id === shooterId) ?? null;
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
  presentPlayerIds: ReadonlySet<string>,
  collapsedPerchIndices: readonly number[]
): JoustStandingPin[] => {
  const slots = resolveJoustRackSlots(arena.perches, lineup.length);
  const collapsed = new Set(collapsedPerchIndices);

  return lineup.flatMap((figure, slotIndex): JoustStandingPin[] => {
    const slot = slots[slotIndex];

    if (presentPlayerIds.has(figure.playerId) || slot === undefined) {
      return [];
    }

    const perchIndex = resolveJoustPinPerchIndex(slot, arena.perches);
    // A felled player whose tower has since come down lies on the sand beneath it, not in the
    // air where the shelf used to be.
    const y =
      perchIndex !== null && collapsed.has(perchIndex)
        ? JOUST_WORLD.floorY - JOUST_PIN_FOOT_RADIUS
        : slot.y;

    return [{ ...figure, slotIndex, perchIndex, x: slot.x, y }];
  });
};

/** The legs' bodies read out of a frame, for the towers the frame was simulated with. */
const toSceneLegs = (
  arena: JoustMinigameArena,
  rubblePerchIndices: readonly number[],
  pinCount: number,
  frame: JoustFrame
): JoustSceneLeg[] => {
  return resolveJoustLegs(arena.perches, rubblePerchIndices).map((leg, legIndex) => ({
    perchIndex: leg.perchIndex,
    foot: readJoustFramePosition(frame, joustLegFootIndex(pinCount, legIndex)),
    top: readJoustFramePosition(frame, joustLegTopIndex(pinCount, legIndex))
  }));
};

/**
 * The one scene both surfaces draw: a track frame while a shot is on screen, otherwise the rest
 * pose for the current pull.
 *
 * A replaying track carries its OWN rack and its own towers — the standing set as it was before
 * that shot — because the players it is in the act of felling are still on their feet in its
 * early frames, and the tower it is folding still has legs. Reading the current state there
 * would erase them mid-flight.
 */
export const resolveJoustScene = ({
  arena,
  lineup,
  downPlayerIds,
  collapsedPerchIndices,
  aim,
  lastShot,
  replayIndex,
  previousShotGhost,
  shooters = [],
  selectedShooterId = null
}: JoustSceneInput): JoustScene => {
  const figureById = new Map(lineup.map((figure) => [figure.playerId, figure]));
  const slots = resolveJoustRackSlots(arena.perches, lineup.length);
  const slotIndexById = new Map(lineup.map((figure, index) => [figure.playerId, index]));
  const toArena = (
    pins: readonly JoustStandingPin[],
    rubblePerchIndices: readonly number[]
  ): JoustArena => ({
    pinFeet: pins.map((pin) => ({ x: pin.x, y: pin.y })),
    perches: arena.perches,
    obstacles: arena.obstacles,
    collapsedPerchIndices: rubblePerchIndices
  });

  if (lastShot === null) {
    // The kind loaded for the next pull sits on the band at rest, at its own link spacing, so
    // the TV shows a Log as long as a Log while the tablet is still pulling.
    const shooter = findShooter(shooters, selectedShooterId);
    const pins = resolveStandingPins(lineup, downPlayerIds, arena.perches);
    const rubblePerchIndices = [...collapsedPerchIndices];
    const frame = resolveJoustRestFrame(
      toArena(pins, rubblePerchIndices),
      aim,
      shooter?.profile ?? JOUST_STANDARD_SHOOTER_PROFILE
    );

    return {
      frame,
      pins,
      fallen: toFallen(
        arena,
        lineup,
        new Set(pins.map((pin) => pin.playerId)),
        collapsedPerchIndices
      ),
      legs: toSceneLegs(arena, rubblePerchIndices, pins.length, frame),
      rubblePerchIndices,
      burstPinIndices: [],
      collapsingPerchIndices: [],
      trail: [],
      ghost: previousShotGhost,
      shooter
    };
  }

  // A replaying track is drawn as the kind that flew it, whatever is loaded now.
  const shooter = findShooter(shooters, lastShot.shooterId);

  const pins = lastShot.pinPlayerIds.flatMap((playerId): JoustStandingPin[] => {
    const figure = figureById.get(playerId);
    const slotIndex = slotIndexById.get(playerId);
    const slot = slotIndex === undefined ? undefined : slots[slotIndex];

    if (figure === undefined || slotIndex === undefined || slot === undefined) {
      return [];
    }

    return [
      {
        ...figure,
        slotIndex,
        perchIndex: resolveJoustPinPerchIndex(slot, arena.perches),
        x: slot.x,
        y: slot.y
      }
    ];
  });
  const rubblePerchIndices = [...lastShot.rubblePerchIndices];
  const clampedIndex = Math.max(0, Math.min(replayIndex, lastShot.run.keyframes.length - 1));
  const frame =
    blendFrames(lastShot.run.keyframes, clampedIndex) ??
    resolveJoustRestFrame(
      toArena(pins, rubblePerchIndices),
      aim,
      shooter?.profile ?? JOUST_STANDARD_SHOOTER_PROFILE
    );
  // Bursts and the trail are counted in whole keyframes: the last one fully reached.
  const reachedIndex = Math.floor(clampedIndex);

  return {
    frame,
    pins,
    fallen: toFallen(arena, lineup, new Set(lastShot.pinPlayerIds), collapsedPerchIndices),
    legs: toSceneLegs(arena, rubblePerchIndices, pins.length, frame),
    rubblePerchIndices,
    burstPinIndices: lastShot.run.topples
      .filter(
        (topple) =>
          reachedIndex >= topple.frameIndex && reachedIndex < topple.frameIndex + IMPACT_FRAMES
      )
      .map((topple) => topple.pinIndex),
    collapsingPerchIndices: lastShot.run.collapses
      .filter(
        (collapse) =>
          reachedIndex >= collapse.frameIndex &&
          reachedIndex < collapse.frameIndex + COLLAPSE_FRAMES
      )
      .map((collapse) => collapse.perchIndex),
    trail: lastShot.run.keyframes
      .slice(Math.max(0, reachedIndex - JOUST_TRAIL_FRAMES), reachedIndex)
      .map((flown) => readJoustFramePosition(flown, JOUST_SHOOTER_HEAD_INDEX)),
    ghost: null,
    shooter
  };
};

export const isReplayFinished = (
  lastShot: JoustMinigameShot | null,
  replayIndex: number
): boolean => {
  return lastShot === null || replayIndex >= lastShot.run.keyframes.length - 1;
};
