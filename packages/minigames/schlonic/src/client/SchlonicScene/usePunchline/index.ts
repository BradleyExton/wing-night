import { useId, useRef, type MutableRefObject, type RefObject } from "react";
import type { SchlonicFrame, SchlonicZone } from "@wingnight/shared";
import { SCHLONIC_WORLD, resolveSchlonicGroundY } from "@wingnight/shared";

import { WIPEOUT_BEAT_MS } from "../../beats/index.js";
import { paintBurst } from "../Burst/index.js";
import type { SchlonicCamera } from "../camera/index.js";
import type { FallPunchlineHandle } from "../FallPunchline/index.js";
import {
  FALL_DROP_MS,
  resolveEater,
  resolveEaterSquash,
  resolveKnockedHen,
  resolveRunawayBoard,
  resolveTrench,
  resolveTrenchHen
} from "../punchlineTimeline/index.js";
import { placeRiderBoard, placeRiderHen, type RiderRefs } from "../Rider/index.js";
import { resolveLooseBoardTransform, resolveStanceTransform } from "../riderPlacement/index.js";
import { resolveSquashTransform, type WipeoutPunchlineHandle } from "../WipeoutPunchline/index.js";

/** The scene's own parts the punchline moves: the rider, the burst, the zone's props. */
export type PunchlineRig = {
  frameRef: RefObject<HTMLDivElement>;
  riderRef: RefObject<RiderRefs>;
  burstRef: RefObject<SVGGElement>;
  propRefs: MutableRefObject<Map<number, SVGGElement>>;
  zoneRef: MutableRefObject<SchlonicZone>;
  cameraRef: MutableRefObject<SchlonicCamera>;
};

export type Punchline = {
  /** The group around the rider, clipped at the trench's lip while the hen is down it. */
  runnerClipRef: RefObject<SVGGElement>;
  /** The clip's id, unique per scene: the tablet and the TV preview share one document. */
  trenchClipId: string;
  fallRef: RefObject<FallPunchlineHandle>;
  wipeoutRef: RefObject<WipeoutPunchlineHandle>;
  /** Paint the run that went wrong as its joke, `progress` 0 → 1 across the wipeout beat. */
  paint: (frame: SchlonicFrame, progress: number, wingsLost: number) => void;
  /** Put everything the joke moved back, before the scene paints a run again. */
  clear: () => void;
};

/**
 * The scene's punchlines (`punchlineTimeline/`): which layer plays, where the rider and its board
 * go while it does, and which of the zone's own badniks gets fed. Kept out of the scene so the
 * scene's own paint stays the run's, and so the scene knows only that a beat can end in a joke.
 */
export const usePunchline = (rig: PunchlineRig): Punchline => {
  const runnerClipRef = useRef<SVGGElement>(null);
  const trenchClipId = `schlonic-trench-clip${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;
  const fallRef = useRef<FallPunchlineHandle>(null);
  const wipeoutRef = useRef<WipeoutPunchlineHandle>(null);
  // The zone badnik a wipeout's wings are being fed to, squashed as it eats and put back after.
  const eaterPropRef = useRef<number | null>(null);
  const kindRef = useRef<"fell" | "wiped" | null>(null);

  // The hen put somewhere the sim never would: down a trench, or flat on its back — off its
  // board either way, so it stands on its own soles.
  const placeHen = (x: number, y: number, angle: number, opacity = 1, tuck = 0): void => {
    placeRiderHen(
      rig.riderRef.current,
      `translate(${x} ${y}) rotate(${angle})`,
      resolveStanceTransform(SCHLONIC_WORLD.runnerRadius, tuck),
      opacity
    );
  };

  const clear = (): void => {
    if (kindRef.current === null) {
      return;
    }

    kindRef.current = null;
    rig.frameRef.current?.removeAttribute("data-schlonic-punchline");
    fallRef.current?.hide();
    wipeoutRef.current?.hide();
    runnerClipRef.current?.removeAttribute("clip-path");

    if (eaterPropRef.current !== null) {
      rig.propRefs.current.get(eaterPropRef.current)?.removeAttribute("transform");
      eaterPropRef.current = null;
    }
  };

  // Into the roadworks: the hen and its board drop down the trench, the dust comes up out of it,
  // then the hen peeks back over the lip while the raccoon climbs out with its handful.
  const paintFall = (frame: SchlonicFrame, elapsedMs: number, wingsLost: number): void => {
    const zone = rig.zoneRef.current;
    const trench = resolveTrench(zone, frame);
    const hen = resolveTrenchHen(elapsedMs, trench);
    const scrollX = frame.x - SCHLONIC_WORLD.runnerX;

    runnerClipRef.current?.setAttribute("clip-path", `url(#${trenchClipId})`);

    if (elapsedMs < FALL_DROP_MS) {
      // Down the shaft, tipping forward as it goes, the board a beat behind it.
      const share = elapsedMs / FALL_DROP_MS;
      const drop = share * share * 30;

      placeHen(SCHLONIC_WORLD.runnerX, frame.y + drop, share * 70, 1, 0.3);
      placeRiderBoard(
        rig.riderRef.current,
        resolveLooseBoardTransform(SCHLONIC_WORLD.runnerX + 2, frame.y + SCHLONIC_WORLD.runnerRadius + drop * 0.8, -share * 120),
        0,
        1
      );
    } else if (hen.visible) {
      placeHen(hen.x, hen.y, hen.angle);
      placeRiderBoard(rig.riderRef.current, "", 0, 0);
    } else {
      placeHen(hen.x, hen.y, 0, 0);
      placeRiderBoard(rig.riderRef.current, "", 0, 0);
    }

    paintBurst(rig.burstRef.current, frame);
    fallRef.current?.paint({
      elapsedMs,
      trench,
      wingsLost,
      camera: rig.cameraRef.current,
      groundAt: (screenX) => resolveSchlonicGroundY(zone, scrollX + screenX)
    });
  };

  // Wiped out: knocked flat, the board rolling on without it, and the wings it dropped rolling
  // off down the sidewalk to the nearest badnik, which eats them one at a time.
  const paintKnockedOut = (frame: SchlonicFrame, elapsedMs: number): void => {
    const zone = rig.zoneRef.current;
    const knocked = resolveKnockedHen(elapsedMs, frame, zone);
    const eater = resolveEater(zone, frame, rig.cameraRef.current);
    const board = resolveRunawayBoard(elapsedMs, frame, zone);

    placeHen(SCHLONIC_WORLD.runnerX + knocked.dx, knocked.y, knocked.angle);
    placeRiderBoard(
      rig.riderRef.current,
      resolveLooseBoardTransform(board.x, board.y - board.hop, board.hop * 6),
      0,
      1
    );
    rig.burstRef.current?.setAttribute("opacity", "0");
    wipeoutRef.current?.paint({ elapsedMs, frame, zone, eater });

    if (eater.kind === "zone") {
      const squash = resolveEaterSquash(elapsedMs);

      eaterPropRef.current = eater.propIndex;
      rig.propRefs.current
        .get(eater.propIndex)
        ?.setAttribute("transform", resolveSquashTransform(eater.x, eater.y, squash.sx, squash.sy));
    }
  };

  const paint = (frame: SchlonicFrame, progress: number, wingsLost: number): void => {
    const elapsedMs = progress * WIPEOUT_BEAT_MS;
    const kind = frame.outcome === "fell" ? "fell" : "wiped";

    kindRef.current = kind;
    // Where a harness (and the e2e suite) reads which joke is on screen.
    rig.frameRef.current?.setAttribute("data-schlonic-punchline", kind);
    rig.riderRef.current?.sparks?.setAttribute("opacity", "0");

    if (kind === "fell") {
      paintFall(frame, elapsedMs, wingsLost);
    } else {
      paintKnockedOut(frame, elapsedMs);
    }
  };

  return { runnerClipRef, trenchClipId, fallRef, wipeoutRef, paint, clear };
};

