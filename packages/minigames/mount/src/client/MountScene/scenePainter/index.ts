import type { RefObject } from "react";
import { MOUNT_WORLD, resolveMountCrown, type MountPile, type MountState, type MountVec } from "@wingnight/shared";

import { LINE_JUMP_SHARE } from "../../beats/index.js";
import { formatHens } from "../../lineHeight/index.js";
import {
  easeCamera,
  formatMountCamera,
  resolveFitCamera,
  resolveFollowCamera,
  resolveMountExtent,
  resolveTorsoCentre,
  resolveViewBox,
  type MountCamera,
  type MountCameraFit
} from "../camera/index.js";
import type { ClimberHandle } from "../Climber/index.js";
import { mountSceneCopy } from "../copy.js";
import type { HighLineHandle } from "../HighLine/index.js";
import type { LimbHandlesHandle } from "../LimbHandles/index.js";
import { resolveRagdollTransforms } from "../ragdollTransforms/index.js";

export type ScenePainterRefs = {
  frame: RefObject<HTMLDivElement>;
  svg: RefObject<SVGSVGElement>;
  climber: RefObject<ClimberHandle>;
  handles: RefObject<LimbHandlesHandle>;
  line: RefObject<HighLineHandle>;
  arrow: RefObject<HTMLParagraphElement>;
};

/** What the scene's latest render knows: the box's aspect, the pile drawn, whose climb it is. */
export type ScenePainterContext = { aspect: number; pile: MountPile; climberName: string };

export type ScenePainterHandle = {
  paint: (state: MountState) => void;
  paintMount: (state: MountState, progress: number) => void;
  paintStuck: (state: MountState, progress: number) => void;
  paintPile: () => void;
  shake: () => void;
  holdCamera: (held: boolean) => void;
  toWorld: (clientX: number, clientY: number) => MountVec | null;
};

export type ScenePainter = {
  handle: ScenePainterHandle;
  setContext: (context: ScenePainterContext) => void;
  /** Paints the last picture again, through the camera the current box and pile call for. */
  repaint: () => void;
  camera: () => MountCamera;
};

// A share of the way to the target camera each frame: the close-up keeps up with a fling, the
// room's camera drifts as the pile grows.
const FOLLOW_EASE = 0.18;
const FIT_EASE = 0.08;
// How fast a recovering hen blinks, in ticks a phase.
const BLINK_TICKS = 6;
const BLINK_OPACITY = 0.35;
// The room's camera height at which the line's tag is drawn at its own size: taller cameras grow
// it with them, so it reads the same on the wall however tall the pile has got.
const FIT_LABEL_HEIGHT = 220;

const setIfChanged = (element: Element | null, name: string, value: string): void => {
  if (element !== null && element.getAttribute(name) !== value) {
    element.setAttribute(name, value);
  }
};

const easeOut = (share: number): number => 1 - (1 - share) * (1 - share) * (1 - share);

const prefersReducedMotion = (): boolean => {
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

/**
 * The scene's imperative half, apart from React so the component stays a drawing: it owns the
 * camera (eased toward each frame's target, frozen under a held finger on the tablet), writes the
 * harness's numbers on the scene's root, and places the climber, the handles and the line.
 */
export const createScenePainter = (fit: MountCameraFit, refs: ScenePainterRefs): ScenePainter => {
  let context: ScenePainterContext | null = null;
  let camera: MountCamera = { x: -200, y: -206, width: 352, height: 220 };
  let snapNext = true;
  let held = false;
  let lastTick = -1;
  let last: (() => void) | null = null;

  const frame = (): HTMLDivElement | null => refs.frame.current;

  const applyCamera = (target: MountCamera, share: number): void => {
    camera = share >= 1 ? target : easeCamera(camera, target, share);
    setIfChanged(refs.svg.current, "viewBox", resolveViewBox(camera));
    setIfChanged(frame(), "data-mount-camera", formatMountCamera(camera));
    refs.line.current?.scaleLabel(fit.kind === "fit-all" ? camera.height / FIT_LABEL_HEIGHT : 1);
  };

  const aimCamera = (state: MountState | null): void => {
    if (context === null) {
      return;
    }

    const snap = snapNext;

    snapNext = false;

    if (fit.kind === "fit-all" || state === null) {
      const poses = state === null ? [] : [state.start, state.pose];

      applyCamera(resolveFitCamera(resolveMountExtent(context.pile, poses), context.aspect), snap ? 1 : FIT_EASE);
      return;
    }

    if (held && !snap) {
      return;
    }

    applyCamera(resolveFollowCamera(resolveTorsoCentre(state.pose), context.aspect), snap ? 1 : FOLLOW_EASE);
  };

  // The tablet's arrow on the top edge when the line is out of the close-up: how far it is above
  // the climber's crown, in hens.
  const paintArrow = (crownHeight: number | null): void => {
    const arrow = refs.arrow.current;

    if (arrow === null || context === null) {
      return;
    }

    const lineHeight = context.pile.highLine.height;
    const isAbove = crownHeight !== null && MOUNT_WORLD.floorY - lineHeight < camera.y;

    setIfChanged(arrow, "data-hidden", isAbove ? "false" : "true");

    if (isAbove) {
      const text = mountSceneCopy.lineAbove(formatHens(lineHeight - crownHeight));

      if (arrow.textContent !== text) {
        arrow.textContent = text;
      }
    }
  };

  const paintClimber = (state: MountState, opacity: number): number => {
    if (state.tick < lastTick) {
      snapNext = true;
    }

    lastTick = state.tick;
    refs.climber.current?.paint(resolveRagdollTransforms(state.pose), opacity);
    refs.handles.current?.paint(state.pose, state.limbs);

    const crownHeight = MOUNT_WORLD.floorY - resolveMountCrown(state.pose).y;

    setIfChanged(frame(), "data-mount-tick", `${state.tick}`);
    setIfChanged(frame(), "data-mount-crown-height", `${Math.round(crownHeight * 10) / 10}`);
    setIfChanged(frame(), "data-mount-falls", `${state.falls.length}`);

    return crownHeight;
  };

  const paint = (state: MountState): void => {
    last = (): void => paint(state);

    const recovering = state.tick < state.recoveringUntilTick;
    const blink = recovering && Math.floor(state.tick / BLINK_TICKS) % 2 === 0;

    frame()?.removeAttribute("data-mount-climb-outcome");
    refs.line.current?.reset();

    const crownHeight = paintClimber(state, blink ? BLINK_OPACITY : 1);

    aimCamera(state);
    paintArrow(crownHeight);
  };

  const paintMount = (state: MountState, progress: number): void => {
    last = (): void => paintMount(state, progress);

    const crown = resolveMountCrown(state.pose);
    const crownHeight = paintClimber(state, 1);

    held = false;
    setIfChanged(frame(), "data-mount-climb-outcome", "mounted");
    refs.line.current?.jump(
      { height: crownHeight, x: crown.x, name: context?.climberName ?? "" },
      easeOut(Math.min(1, progress / LINE_JUMP_SHARE))
    );
    aimCamera(state);
    paintArrow(null);
  };

  const paintStuck = (state: MountState): void => {
    last = (): void => paintStuck(state);
    held = false;
    setIfChanged(frame(), "data-mount-climb-outcome", "timeout");
    refs.line.current?.reset();
    paintClimber(state, 1);
    aimCamera(state);
    paintArrow(null);
  };

  const paintPile = (): void => {
    last = paintPile;
    frame()?.removeAttribute("data-mount-climb-outcome");
    refs.climber.current?.hide();
    refs.handles.current?.hide();
    refs.line.current?.reset();
    // The pile alone is framed whole on both surfaces; the next climb snaps back to the close-up.
    aimCamera(null);
    snapNext = true;
    lastTick = -1;
    paintArrow(null);
  };

  const shake = (): void => {
    const element = frame();

    if (element === null || typeof element.animate !== "function" || prefersReducedMotion()) {
      return;
    }

    element.animate(
      [
        { transform: "translate(0, 0)" },
        { transform: "translate(0, 6px)" },
        { transform: "translate(0, -3px)" },
        { transform: "translate(0, 0)" }
      ],
      { duration: 260, easing: "ease-out" }
    );
  };

  const toWorld = (clientX: number, clientY: number): MountVec | null => {
    const svg = refs.svg.current;
    const matrix = svg?.getScreenCTM() ?? null;

    if (svg === null || matrix === null) {
      return null;
    }

    const point = svg.createSVGPoint();

    point.x = clientX;
    point.y = clientY;

    const world = point.matrixTransform(matrix.inverse());

    return { x: world.x, y: world.y };
  };

  return {
    handle: {
      paint,
      paintMount,
      paintStuck: (state): void => paintStuck(state),
      paintPile,
      shake,
      holdCamera: (isHeld): void => {
        held = isHeld;
      },
      toWorld
    },
    setContext: (next): void => {
      context = next;
    },
    // A new box or a new pile is a new frame, not a drift: snap straight to its camera.
    repaint: (): void => {
      snapNext = true;
      last?.();
    },
    camera: () => camera
  };
};
