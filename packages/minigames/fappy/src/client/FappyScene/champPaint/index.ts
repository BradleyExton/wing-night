import type { FappyChampKind, FappyGate, FappySpit } from "@wingnight/shared";
import { FAPPY_WORLD, resolveFappyChampTop, resolveFappySpit, resolveFappySpitPhase } from "@wingnight/shared";
import { resolveSchlongFace, resolveSchlongPaths, type SchlongVec2 } from "@wingnight/cast";

import { fappyPalette } from "../palette.js";

// Where every part of a champ is at a tick, as pure maths: the builds, the
// idle sway, the whip in a bird's wake, the spit tell and the glob. The
// component draws the rest pose from it once and the scene's loop rewrites
// the parts from it every frame, so nothing in here touches the DOM.

export type ChampSkin = {
  body: string;
  dark: string;
  light: string;
  vein: string;
};

/**
 * What a kind of champ is built like and how it moves. The sim's hitbox is the same for all of
 * them — the gate's column under `champTop`, and every head's top IS `champTop` whatever its
 * radius — so a build is a look, never an advantage: the big one just fills more of its column.
 */
export type ChampLook = {
  headRadius: number;
  shaftRadius: number;
  ballRadius: number;
  // The idle wiggle: the tip sways this far each way on a wave of this period, and the middle
  // of the shaft follows it a beat behind, so it whips rather than tilts.
  swayPeriodTicks: number;
  swayTip: number;
  swayMid: number;
  // How it answers a bird going past: how far it whips, how fast it rings, how long it takes
  // to settle. A heavy one swings slow and long; a slim one twangs.
  wobbleUnits: number;
  wobbleRate: number;
  wobbleDecayTicks: number;
  skin: ChampSkin;
};

export const CHAMP_LOOKS: Record<FappyChampKind, ChampLook> = {
  pink: {
    headRadius: 3.5,
    shaftRadius: 2.7,
    ballRadius: 2.9,
    swayPeriodTicks: 53,
    swayTip: 2.1,
    swayMid: 1.1,
    wobbleUnits: 2.6,
    wobbleRate: 0.5,
    wobbleDecayTicks: 18,
    skin: {
      body: fappyPalette.champ,
      dark: fappyPalette.champDark,
      light: fappyPalette.champLight,
      vein: fappyPalette.champVein
    }
  },
  ebony: {
    headRadius: 4.5,
    shaftRadius: 3.4,
    ballRadius: 3.5,
    swayPeriodTicks: 76,
    swayTip: 1.5,
    swayMid: 0.8,
    wobbleUnits: 2.2,
    wobbleRate: 0.34,
    wobbleDecayTicks: 30,
    skin: {
      body: fappyPalette.ebony,
      dark: fappyPalette.ebonyDark,
      light: fappyPalette.ebonyLight,
      vein: fappyPalette.ebonyVein
    }
  },
  ivory: {
    headRadius: 3,
    shaftRadius: 2.2,
    ballRadius: 2.5,
    swayPeriodTicks: 37,
    swayTip: 2.6,
    swayMid: 1.5,
    wobbleUnits: 3.2,
    wobbleRate: 0.68,
    wobbleDecayTicks: 14,
    skin: {
      body: fappyPalette.ivory,
      dark: fappyPalette.ivoryDark,
      light: fappyPalette.ivoryLight,
      vein: fappyPalette.ivoryVein
    }
  }
};

const SWAY_LAG_RADIANS = 0.7;
// At full stretch the shaft thins by this much: it is being pulled, not grown.
const STRETCH_THIN = 0.12;
// A champ looks at the bird once it is this close, then watches it past.
const LOOK_RANGE_UNITS = 70;
// The spit tell and the spit itself. Over the last ticks of its beat a spitter's head hinges
// open at the rim, the eyes going back with it; on the beat the glob leaves the open neck and
// the head snaps shut over the next few ticks with a gulp down the shaft. The sim knows only
// the beat; the open head is the room's warning that a glob is coming.
export const SPIT_WINDUP_TICKS = 22;
export const SPIT_SNAP_TICKS = 10;
const LID_OPEN_DEGREES = 62;
const GULP = 0.22;
// The balls squash and stretch with the wobble, and breathe a little on their own.
const BALL_SQUASH = 0.14;
const BALL_BREATH = 0.03;

export type ChampPaint = {
  body: string;
  gloss: string;
  veins: string;
  corona: string;
  slit: string;
  ballsTransform: string;
  faceTransform: string;
  pupilsTransform: string;
  /** The head's hinge, in the face group's own units; `rotate(0 …)` when the mouth is shut. */
  lidTransform: string;
  /** 0 shut, 1 gaping: the tell that a glob is about to leave. */
  mouthOpen: number;
  /** The glob this champ has in the air, in the gate layer's units, or null. */
  spit: FappySpit | null;
  /** Where the top of the head is this tick — the sim's `champTop`, for the room to read. */
  top: number;
};

export const champCentreX = (gate: FappyGate): number => gate.x + FAPPY_WORLD.gateWidth / 2;

export const resolveChampLook = (gate: FappyGate): ChampLook => CHAMP_LOOKS[gate.champKind];

/**
 * How far the spitter's head is open at this tick, 0 → 1: hinging open through the windup at
 * the end of its beat (eased in, so it creeps then gapes), snapping shut over the first ticks
 * of the next. Never open on a champ that does not spit.
 */
export const resolveMouthOpen = (gate: FappyGate, tick: number): number => {
  const phase = resolveFappySpitPhase(gate, tick);

  if (phase === null) {
    return 0;
  }

  if (phase < SPIT_SNAP_TICKS) {
    return 1 - phase / SPIT_SNAP_TICKS;
  }

  const windupStart = gate.spitPeriodTicks - SPIT_WINDUP_TICKS;

  if (phase >= windupStart) {
    const progress = (phase - windupStart) / SPIT_WINDUP_TICKS;

    return progress * progress;
  }

  return 0;
};

/**
 * The ring a champ is left with after the bird goes past: a damped sine in the ticks since the
 * bird's trailing edge cleared the gate's column, which is the same moment the sim counted the
 * gate. Nothing until then; nothing again once it has settled.
 */
export const resolveWakeWobble = (gate: FappyGate, look: ChampLook, lookAt: SchlongVec2 | null): number => {
  if (lookAt === null) {
    return 0;
  }

  const { birdRadius, gateWidth, scrollSpeed } = FAPPY_WORLD;
  const wakeTicks = (lookAt.x - birdRadius - gate.x - gateWidth) / scrollSpeed;

  if (wakeTicks < 0 || wakeTicks > look.wobbleDecayTicks * 5) {
    return 0;
  }

  return Math.exp(-wakeTicks / look.wobbleDecayTicks) * Math.sin(wakeTicks * look.wobbleRate);
};

/**
 * Where everything on a champ is at one tick. The head's centre is one radius under the
 * sim's `champTop`, so the glans the bird sees is the line the bird dies on; the shaft is a
 * bend from the sand up to it, swaying at the tip and lagging in the middle, and whipping in
 * the wake of a bird that has just gone past. `lookAt` is the bird in the gate layer's own
 * coordinates; the pupils follow it once it is close.
 */
export const resolveChampPaint = (gate: FappyGate, tick: number, lookAt: SchlongVec2 | null): ChampPaint => {
  const { floorY } = FAPPY_WORLD;
  const look = resolveChampLook(gate);
  const centreX = champCentreX(gate);
  const top = resolveFappyChampTop(gate, tick);
  const phase = ((tick + gate.champPhaseTicks) / look.swayPeriodTicks) * Math.PI * 2;
  const wobble = resolveWakeWobble(gate, look, lookAt);
  const swayMid = Math.sin(phase) * look.swayMid + wobble * look.wobbleUnits * 0.45;
  const swayTip = Math.sin(phase - SWAY_LAG_RADIANS) * look.swayTip + wobble * look.wobbleUnits;
  const stretch = gate.champBob > 0 ? (gate.champTop - top) / gate.champBob : 0;
  const spitPhase = resolveFappySpitPhase(gate, tick);
  const gulp =
    spitPhase !== null && spitPhase < SPIT_SNAP_TICKS ? Math.sin((Math.PI * spitPhase) / SPIT_SNAP_TICKS) : 0;
  const base: SchlongVec2 = { x: centreX, y: floorY - 0.5 };
  const head: SchlongVec2 = { x: centreX + swayTip, y: top + look.headRadius };
  const height = base.y - head.y;
  const spine: SchlongVec2[] = [
    base,
    { x: centreX + swayMid * 0.35, y: base.y - height * 0.3 },
    { x: centreX + swayMid, y: base.y - height * 0.58 },
    { x: centreX + (swayMid + swayTip) / 2, y: base.y - height * 0.82 },
    head
  ];
  const paths = resolveSchlongPaths(spine, {
    shaftRadius: look.shaftRadius * (1 - STRETCH_THIN * stretch) * (1 + GULP * gulp),
    headRadius: look.headRadius
  });
  const isLooking = lookAt !== null && Math.abs(lookAt.x - paths.head.x) < LOOK_RANGE_UNITS;
  const face = resolveSchlongFace(
    { x: 0, y: 0 },
    look.headRadius,
    isLooking && lookAt !== null ? { x: lookAt.x - paths.head.x, y: lookAt.y - paths.head.y } : null
  );
  const mouthOpen = resolveMouthOpen(gate, tick);
  const hinge = { x: look.headRadius * 0.85, y: look.headRadius * 0.55 };
  const ballSquash = wobble * BALL_SQUASH + Math.sin(phase * 2) * BALL_BREATH;
  const ballsCentreY = floorY - look.ballRadius + 0.3;

  return {
    body: paths.body,
    gloss: paths.gloss,
    veins: paths.veins,
    corona: paths.corona,
    slit: paths.slit,
    ballsTransform: `translate(${centreX} ${ballsCentreY}) scale(${1 + ballSquash} ${1 - ballSquash}) translate(${-centreX} ${-ballsCentreY})`,
    faceTransform: `translate(${paths.head.x} ${paths.head.y})`,
    pupilsTransform: `translate(${face.pupilOffset.x} ${face.pupilOffset.y})`,
    lidTransform: `rotate(${mouthOpen * LID_OPEN_DEGREES} ${hinge.x} ${hinge.y})`,
    mouthOpen,
    spit: resolveFappySpit(gate, tick),
    top
  };
};

