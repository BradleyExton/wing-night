import { BRAWL_CREW_WORLD, type BrawlCrewBlock, type BrawlCrewFrame, type BrawlCrewHen, type BrawlCrewOutcome } from "@wingnight/shared";

import { BEAT_MS } from "../../beats/index.js";
import { createCrewEventReader } from "../../crewEvents/index.js";
import type { HenFigure } from "../../resolveHenFigure/index.js";
import type { CrewStreet } from "../../useCrewFrame/index.js";
import { SKY_EXTENT, SKY_PARALLAX, resolveGroundY, resolveStreetExtent } from "../Backdrop/index.js";
import { paintBayLift, type BayLiftRefs } from "../BayLift/index.js";
import { resolveBayBeat, resolveClearedBeat, resolveTimeoutBeat, type HenBeat } from "../beatTimeline/index.js";
import { paintBell } from "../Bell/index.js";
import { crewSceneCopy } from "../copy.js";
import { paintDunkSplash, resolveDunkSplash } from "../DunkSplash/index.js";
import type { FigureLayerHandle } from "../FigureLayer/index.js";
import { paintGo } from "../GoArrow/index.js";
import type { HenPaint } from "../HenSlot/index.js";
import { resolveHenOpacity, resolveHenPose, resolveReviveShare } from "../henPose/index.js";
import type { PickupLayerHandle } from "../PickupLayer/index.js";
import { SHAKE_PX, shakeElement } from "../shake/index.js";

const WORLD = BRAWL_CREW_WORLD;

/** How far in from the window's edges a hen's name is kept, so it is never cut off at one. */
const TAG_MARGIN = 16;

const round = (value: number): number => Math.round(value * 100) / 100;

const setIfChanged = (element: Element | null, name: string, value: string): void => {
  if (element !== null && element.getAttribute(name) !== value) {
    element.setAttribute(name, value);
  }
};

type Extent = { left: number; right: number };

/**
 * Stands a layer drawn from `extent.left` to `extent.right` where it belongs in the window: its
 * left edge and its width as shares of the window's own, so one world unit is the same size on
 * every layer.
 */
export const placeLayer = (element: SVGSVGElement | null, extent: Extent): void => {
  if (element === null) {
    return;
  }

  element.style.left = `${round((extent.left / WORLD.width) * 100)}%`;
  element.style.width = `${round(((extent.right - extent.left) / WORLD.width) * 100)}%`;
};

/** A layer slid `units` of the world to the left, as a share of its own width. Pure. */
export const resolveLayerSlide = (extent: Extent, units: number): string => {
  return `translate3d(${round((-units / (extent.right - extent.left)) * 100)}%, 0, 0)`;
};

/**
 * Slides a layer: a compositor move, so the layer is never painted again. Written only when it
 * changes — the camera is locked for most of a block.
 */
const slideLayer = (element: SVGSVGElement | null, extent: Extent, units: number): void => {
  const value = resolveLayerSlide(extent, units);

  if (element !== null && element.style.transform !== value) {
    element.style.transform = value;
  }
};

type Beat = {
  /** The fight it is the ending of (`CrewStreet.key`). */
  key: string;
  outcome: BrawlCrewOutcome;
  /** This screen's own clock when the beat began; null for an ending it never saw happen, which is drawn already over. */
  startedAtMs: number | null;
};

/** How far through its beat an ending is, nought to one. Pure. */
export const resolveBeatProgress = (beat: Pick<Beat, "outcome" | "startedAtMs">, nowMs: number): number => {
  return beat.startedAtMs === null ? 1 : Math.min(1, Math.max(0, (nowMs - beat.startedAtMs) / BEAT_MS[beat.outcome]));
};

/** Everything the scene rendered that a frame is written onto. Read at paint time, never held. */
export type SceneElements = {
  root: HTMLDivElement | null;
  window: HTMLDivElement | null;
  sky: SVGSVGElement | null;
  street: SVGSVGElement | null;
  world: SVGGElement | null;
  figures: FigureLayerHandle | null;
  pickups: PickupLayerHandle | null;
  dunk: SVGGElement | null;
  go: SVGGElement | null;
  bell: SVGGElement | null;
  bay: BayLiftRefs | null;
};

type ScenePainterInput = {
  street: CrewStreet;
  elements: () => SceneElements;
  layout: () => BrawlCrewBlock;
  figures: () => readonly HenFigure[];
  /** Mounts the bay's geese for a crew of this many, or takes them down with null. */
  setBayCrew: (crew: number | null) => void;
};

/**
 * Writes the street onto the scene, frame by frame (docs/minigames/brawl-crew-spec.md §0.5,
 * §0.7). `draw` is called for every frame this screen has (`CrewStreet.subscribe`): a live frame
 * is painted as it is; a terminal one starts its ending's beat — block clear, the bay, the bell —
 * which then runs on this screen's own clock over that last frame. The fight never pauses for a
 * hit; the picture flinches instead.
 */
export const createScenePainter = ({ street, elements, layout, figures, setBayCrew }: ScenePainterInput): { draw: () => void; dispose: () => void } => {
  const events = createCrewEventReader();
  // The fight this screen last saw still going, so an ending it watched arrive is played and one
  // it was merely handed (a wall reloaded during the hold) is shown already over.
  let liveKey: string | null = null;
  let beat: Beat | null = null;
  let beatHandle = 0;

  const resolveLiveHen = (frame: BrawlCrewFrame, hen: BrawlCrewHen): HenPaint => ({
    x: hen.x,
    groundY: resolveGroundY(hen.z),
    z: hen.z,
    facing: hen.facing,
    pose: resolveHenPose(hen, frame.tick),
    opacity: resolveHenOpacity(hen, frame.tick),
    state: hen.state,
    revive: resolveReviveShare(hen, frame.tick),
    tagX: Math.max(frame.cameraX + TAG_MARGIN, Math.min(frame.cameraX + WORLD.width - TAG_MARGIN, hen.x)),
    tag: crewSceneCopy.tag(figures()[hen.slot]?.playerName ?? null, hen.slot, hen.state)
  });

  const withBeat = (live: HenPaint, moved: HenBeat): HenPaint => ({
    ...live,
    x: live.x + moved.dx,
    tagX: live.tagX + moved.dx,
    facing: moved.facing,
    pose: moved.pose,
    opacity: moved.opacity,
    lift: moved.lift,
    tilt: moved.tilt,
    revive: 0
  });

  // The street under the sim's camera, and the sim's own numbers on the scene for a harness.
  const paintStreet = (frame: BrawlCrewFrame, resolveHen: (hen: BrawlCrewHen) => HenPaint): void => {
    const scene = elements();
    const block = layout();

    setIfChanged(scene.world, "transform", `translate(${round(-frame.cameraX)} 0)`);
    slideLayer(scene.street, resolveStreetExtent(block), frame.cameraX);
    slideLayer(scene.sky, SKY_EXTENT, frame.cameraX * SKY_PARALLAX);
    scene.pickups?.paint(frame);
    paintDunkSplash(scene.dunk, resolveDunkSplash(frame, block.hazard?.kind ?? null));
    scene.figures?.paint(frame, resolveHen);
    setIfChanged(scene.root, "data-brawl-tick", `${frame.tick}`);
    setIfChanged(scene.root, "data-brawl-wave", `${frame.waveIndex}`);
    setIfChanged(scene.root, "data-brawl-banked", `${frame.banked}`);
    setIfChanged(scene.root, "data-brawl-outcome", frame.outcome ?? "");
    setIfChanged(scene.root, "data-brawl-locked", frame.cameraLocked ? "true" : "false");
  };

  const paintBeat = (frame: BrawlCrewFrame, held: Beat): number => {
    const scene = elements();
    const progress = resolveBeatProgress(held, performance.now());

    paintGo(scene.go, false);
    paintBell(scene.bell, held.outcome === "timeout" ? progress : null);
    paintStreet(frame, (hen) => {
      const live = resolveLiveHen(frame, hen);

      if (held.outcome === "wipe") {
        const bay = resolveBayBeat(hen, progress);

        paintBayLift(scene.bay, hen.slot, hen, bay);

        return withBeat(live, bay.hen);
      }

      return withBeat(live, held.outcome === "cleared" ? resolveClearedBeat(hen, progress) : resolveTimeoutBeat(hen, progress));
    });
    setIfChanged(scene.root, "data-brawl-beat", progress >= 1 ? "done" : held.outcome);

    return progress;
  };

  const runBeat = (): void => {
    const frame = street.read();

    if (beat === null || frame === null || frame.outcome === null) {
      return;
    }

    if (paintBeat(frame, beat) < 1) {
      beatHandle = window.requestAnimationFrame(runBeat);
    }
  };

  const endBeat = (): void => {
    if (beat === null) {
      return;
    }

    beat = null;
    window.cancelAnimationFrame(beatHandle);
    paintBell(elements().bell, null);
    setBayCrew(null);
    setIfChanged(elements().root, "data-brawl-beat", "");
  };

  const draw = (): void => {
    const frame = street.read();

    if (frame === null) {
      return;
    }

    const key = street.key();

    for (const event of events.read(key, frame)) {
      if (event.kind === "hit" || event.kind === "down") {
        shakeElement(elements().window, SHAKE_PX[event.kind]);
      }
    }

    if (frame.outcome === null) {
      liveKey = key;
      endBeat();
      paintStreet(frame, (hen) => resolveLiveHen(frame, hen));
      // GO whenever the street is waiting to be walked: a wave is down and nobody is through.
      paintGo(elements().go, !frame.cameraLocked);

      return;
    }

    if (beat === null || beat.key !== key) {
      endBeat();
      beat = { key, outcome: frame.outcome, startedAtMs: liveKey === key ? performance.now() : null };

      if (frame.outcome === "wipe") {
        // The geese mount on the next commit; the beat's own loop is painting them by then.
        setBayCrew(frame.hens.length);
      }

      beatHandle = window.requestAnimationFrame(runBeat);
    }

    paintBeat(frame, beat);
  };

  return {
    draw,
    dispose: (): void => {
      window.cancelAnimationFrame(beatHandle);
    }
  };
};
