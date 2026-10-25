import assert from "node:assert/strict";
import test from "node:test";

import { syncBodyLoops } from "./index.js";

// The Top's copy of the body mounts when the bird is dressed, which can be
// long after the body started looping; it takes the body's start times.
test("does start the Top's copy of the body's loops when the body's own started", () => {
  const loop = (animationName: string, startTime: number) => ({ animationName, startTime });
  const layer = (animations: object[]) => ({ getAnimations: () => animations });
  const root = (layers: Record<string, object>) => ({
    querySelector: (selector: string) => (layers[selector] ?? null) as Element | null
  });
  const bodyHop = loop("cast-jig-hop", 120);
  const bodyBob = loop("cast-bob", 40);
  const copyHop = loop("cast-jig-hop", 5000);
  const copyBob = loop("cast-bob", 5000);
  const transition = { transitionProperty: "transform", startTime: 5000 };

  syncBodyLoops(
    root({ '[data-character-jig="body"]': layer([bodyHop]), '[data-character-part="body"]': layer([bodyBob]) }),
    root({ '[data-character-jig="body"]': layer([copyHop]), '[data-character-part="body"]': layer([copyBob, transition]) })
  );

  assert.equal(copyHop.startTime, 120);
  assert.equal(copyBob.startTime, 40);
  // A beat's transition is not a loop, and is the room's to time.
  assert.equal(transition.startTime, 5000);
});
