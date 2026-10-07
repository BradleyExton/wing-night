import assert from "node:assert/strict";
import test from "node:test";

import { createTokenBucket } from "./index.js";

test("does allow a burst up to capacity and refuse the next when the clock stands still", () => {
  const bucket = createTokenBucket({ capacity: 3, refillPerSecond: 2, now: () => 0 });

  assert.deepEqual([bucket.take(), bucket.take(), bucket.take(), bucket.take()], [true, true, true, false]);
});

test("does refill at its rate and never past capacity when time passes", () => {
  let now = 0;
  const bucket = createTokenBucket({ capacity: 2, refillPerSecond: 2, now: () => now });

  bucket.take();
  bucket.take();
  assert.equal(bucket.take(), false);

  now = 499;
  assert.equal(bucket.take(), false);

  now = 500;
  assert.equal(bucket.take(), true);
  assert.equal(bucket.take(), false);

  now = 60_000;
  assert.deepEqual([bucket.take(), bucket.take(), bucket.take()], [true, true, false]);
});
