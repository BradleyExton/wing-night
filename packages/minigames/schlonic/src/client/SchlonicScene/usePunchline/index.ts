import { useId, useRef, type MutableRefObject, type RefObject } from "react";
import { CHARACTER_FOOT } from "@wingnight/cast";
import type { SchlonicFrame, SchlonicZone } from "@wingnight/shared";
import { SCHLONIC_WORLD } from "@wingnight/shared";

import { WIPEOUT_BEAT_MS } from "../../beats/index.js";
import { paintBurst } from "../Burst/index.js";
import type { SchlonicCamera } from "../camera/index.js";
import type { FallPunchlineHandle } from "../FallPunchline/index.js";
import { RUNNER_SCALE, TUCK_SHRINK } from "../Ghost/index.js";
import {
  FALL_DROP_MS,
  resolveBayHen,
  resolveBayX,
  resolveEater,
  resolveEaterSquash,
  resolveKnockedHen
} from "../punchlineTimeline/index.js";
import { resolveSquashTransform, type WipeoutPunchlineHandle } from "../WipeoutPunchline/index.js";

/** The scene's own parts the punchline moves: the runner, the burst, the zone's props. */
export type PunchlineRig = {
  frameRef: RefObject<HTMLDivElement>;
  runnerGroupRef: RefObject<SVGGElement>;
  runnerTuckRef: RefObject<SVGGElement>;
  burstRef: RefObject<SVGGElement>;
  propRefs: MutableRefObject<Map<number, SVGGElement>>;
  zoneRef: MutableRefObject<SchlonicZone>;
  cameraRef: MutableRefObject<SchlonicCamera>;
};

export type Punchline = {
  /** The group around the runner, clipped at the bay's surface while the hen is in the water. */
  runnerClipRef: RefObject<SVGGElement>;
  /** The clip's id, unique per scene: the tablet and the TV preview share one document. */
  bayClipId: string;
  fallRef: RefObject<FallPunchlineHandle>;
  wipeoutRef: RefObject<WipeoutPunchlineHandle>;
  /** Paint the run that went wrong as its joke, `progress` 0 → 1 across the wipeout beat. */
  paint: (frame: SchlonicFrame, progress: number, wingsLost: number) => void;
  /** Put everything the joke moved back, before the scene paints a run again. */
  clear: () => void;
};

/**
 * The scene's punchlines (`punchlineTimeline/`): which layer plays, where the runner goes while
 * it does, and which of the zone's own badniks gets fed. Kept out of the scene so the scene's
 * own paint stays the run's, and so the scene knows only that a beat can end in a joke.
 */
export const usePunchline = (rig: PunchlineRig): Punchline => {
  const runnerClipRef = useRef<SVGGElement>(null);
  const bayClipId = `schlonic-bay-clip${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;
  const fallRef = useRef<FallPunchlineHandle>(null);
  const wipeoutRef = useRef<WipeoutPunchlineHandle>(null);
  // The zone badnik a wipeout's wings are being fed to, squashed as it eats and put back after.
  const eaterPropRef = useRef<number | null>(null);
  const kindRef = useRef<"fell" | "wiped" | null>(null);

  // The runner put somewhere the sim never would: in the bay, or flat on its back.
  const placeRunner = (x: number, y: number, angle: number, scale: number, opacity = 1): void => {
    rig.runnerGroupRef.current?.setAttribute("transform", `translate(${x} ${y}) rotate(${angle})`);
    rig.runnerGroupRef.current?.setAttribute("opacity", `${opacity}`);
    rig.runnerTuckRef.current?.setAttribute(
      "transform",
      `translate(0 ${SCHLONIC_WORLD.runnerRadius}) scale(${scale}) translate(${-CHARACTER_FOOT.x} ${-CHARACTER_FOOT.y})`
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

  // Down a hole: the bird drops out of the zone, and the hole turns out to go to the bay. It
  // comes up in the water, clipped at the surface, while the gull takes its handful.
  const paintFall = (frame: SchlonicFrame, elapsedMs: number, wingsLost: number): void => {
    const bayX = resolveBayX(rig.zoneRef.current, frame, rig.cameraRef.current);
    const hen = resolveBayHen(elapsedMs, bayX);

    if (elapsedMs < FALL_DROP_MS) {
      // Down the shaft, balled up and spinning, gone before the bay has it.
      const share = elapsedMs / FALL_DROP_MS;

      runnerClipRef.current?.removeAttribute("clip-path");
      placeRunner(
        SCHLONIC_WORLD.runnerX,
        frame.y + share * share * 40,
        share * 540,
        RUNNER_SCALE * (1 - TUCK_SHRINK),
        Math.max(0, 1 - share * 1.2)
      );
    } else if (hen.visible) {
      runnerClipRef.current?.setAttribute("clip-path", `url(#${bayClipId})`);
      placeRunner(hen.x, hen.y, hen.angle, RUNNER_SCALE);
    } else {
      rig.runnerGroupRef.current?.setAttribute("opacity", "0");
    }

    paintBurst(rig.burstRef.current, frame);
    fallRef.current?.paint({ elapsedMs, bayX, wingsLost, camera: rig.cameraRef.current });
  };

  // Wiped out: knocked flat, and the wings it dropped roll off down the shore to the nearest
  // badnik, which eats them one at a time.
  const paintKnockedOut = (frame: SchlonicFrame, elapsedMs: number): void => {
    const zone = rig.zoneRef.current;
    const knocked = resolveKnockedHen(elapsedMs, frame, zone);
    const eater = resolveEater(zone, frame, rig.cameraRef.current);

    placeRunner(SCHLONIC_WORLD.runnerX + knocked.dx, knocked.y, knocked.angle, RUNNER_SCALE);
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

    if (kind === "fell") {
      paintFall(frame, elapsedMs, wingsLost);
    } else {
      paintKnockedOut(frame, elapsedMs);
    }
  };

  return { runnerClipRef, bayClipId, fallRef, wipeoutRef, paint, clear };
};
