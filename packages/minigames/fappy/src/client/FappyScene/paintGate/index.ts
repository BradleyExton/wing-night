import type { FappyFrame, FappyGate } from "@wingnight/shared";
import { FAPPY_WORLD } from "@wingnight/shared";

import type { ChampRefs } from "../Champ/index.js";
import type { ChampPaint } from "../champPaint/index.js";
import { resolveEagleShoulders, type EagleRefs } from "../Eagle/index.js";

// The attribute writes for one gate, one frame: the scene's loop resolves
// where everything is and these put it there. Kept out of the scene so the
// component stays the wiring and this stays the painting.

// A glob fades over its last ticks rather than blinking out.
const SPIT_FADE_TICKS = 12;
// A knocked eagle tumbles up and away for this long, then is gone.
const EAGLE_EXIT_TICKS = 40;

export const paintChamp = (refs: ChampRefs, gate: FappyGate, champ: ChampPaint, frame: FappyFrame): void => {
  refs.champ?.setAttribute("data-champ-top", `${champ.top}`);
  refs.balls?.setAttribute("transform", champ.ballsTransform);
  refs.body?.setAttribute("d", champ.body);
  refs.veins?.setAttribute("d", champ.veins);
  refs.gloss?.setAttribute("d", champ.gloss);
  refs.corona?.setAttribute("d", champ.corona);
  refs.slit?.setAttribute("d", champ.slit);
  refs.face?.setAttribute("transform", champ.faceTransform);
  refs.pupils?.setAttribute("transform", champ.pupilsTransform);
  refs.lid?.setAttribute("transform", champ.lidTransform);

  // The hinged head only exists while the mouth is open; shut, the
  // body's own cap is the head.
  const lidDisplay = champ.mouthOpen > 0 ? "" : "none";

  refs.cavity?.setAttribute("display", lidDisplay);
  refs.lidSkin?.setAttribute("display", lidDisplay);

  if (refs.spit !== null) {
    const glob = champ.spit;
    const isSpent =
      glob !== null &&
      frame.splats.some((splat) => splat.gate === gate.index && splat.launchTick === glob.launchTick);

    if (glob === null || isSpent) {
      refs.spit.setAttribute("opacity", "0");
    } else {
      const left = FAPPY_WORLD.spitLifeTicks - glob.age;
      // Stretched along its flight, which is mostly sideways: a thrown
      // thing, not a dropped one.
      refs.spit.setAttribute("transform", `translate(${glob.x} ${glob.y}) rotate(${-12 + glob.age * 0.4})`);
      refs.spit.setAttribute("opacity", `${Math.min(1, left / SPIT_FADE_TICKS)}`);
    }
  }
};

export const paintEagle = (refs: EagleRefs, gate: FappyGate, frame: FappyFrame, wingbeat: number): void => {
  if (refs.eagle === null || gate.eagleBottom === null) {
    return;
  }

  const shoulders = resolveEagleShoulders(gate, gate.eagleBottom);

  // A point left of its pivot rises on a clockwise turn, one right of
  // it on an anticlockwise turn: opposite signs lift both tips together.
  refs.leftWing?.setAttribute("transform", `rotate(${wingbeat} ${shoulders.leftX} ${shoulders.y})`);
  refs.rightWing?.setAttribute("transform", `rotate(${-wingbeat} ${shoulders.rightX} ${shoulders.y})`);

  // A bumped eagle tumbles up and off; one bumped on an earlier attempt
  // (tick -1) is simply not there.
  const knocked = frame.knockedEagles.find((entry) => entry.gate === gate.index);

  if (knocked === undefined) {
    refs.eagle.setAttribute("transform", "");
    refs.eagle.setAttribute("opacity", "1");
  } else if (knocked.tick < 0 || frame.tick - knocked.tick > EAGLE_EXIT_TICKS) {
    refs.eagle.setAttribute("opacity", "0");
  } else {
    const gone = frame.tick - knocked.tick;
    const centreX = gate.x + FAPPY_WORLD.gateWidth / 2;
    const centreY = gate.eagleBottom - 4;

    refs.eagle.setAttribute(
      "transform",
      `translate(${gone * 1.6} ${-gone * 1.9}) rotate(${gone * 9} ${centreX} ${centreY})`
    );
    refs.eagle.setAttribute("opacity", `${Math.max(0, 1 - gone / EAGLE_EXIT_TICKS)}`);
  }
};
