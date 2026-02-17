import assert from "node:assert/strict";
import test from "node:test";

import { createPressAndHoldHandlers } from "./index";

test("invokes callback once when press duration reaches threshold", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });

  let holdCompleteCalls = 0;
  const handlers = createPressAndHoldHandlers({
    holdDurationMs: 800,
    onHoldComplete: () => {
      holdCompleteCalls += 1;
    }
  });

  handlers.start();
  t.mock.timers.tick(799);
  assert.equal(holdCompleteCalls, 0);

  t.mock.timers.tick(1);
  assert.equal(holdCompleteCalls, 1);

  t.mock.timers.reset();
});

test("does not invoke callback when press is cancelled before threshold", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });

  let holdCompleteCalls = 0;
  const handlers = createPressAndHoldHandlers({
    holdDurationMs: 800,
    onHoldComplete: () => {
      holdCompleteCalls += 1;
    }
  });

  handlers.start();
  t.mock.timers.tick(500);
  handlers.cancel();
  t.mock.timers.tick(1000);

  assert.equal(holdCompleteCalls, 0);

  t.mock.timers.reset();
});

test("restarting press resets timer window", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });

  let holdCompleteCalls = 0;
  const handlers = createPressAndHoldHandlers({
    holdDurationMs: 800,
    onHoldComplete: () => {
      holdCompleteCalls += 1;
    }
  });

  handlers.start();
  t.mock.timers.tick(400);
  handlers.start();
  t.mock.timers.tick(799);
  assert.equal(holdCompleteCalls, 0);

  t.mock.timers.tick(1);
  assert.equal(holdCompleteCalls, 1);

  t.mock.timers.reset();
});
