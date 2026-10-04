import assert from "node:assert/strict";
import test from "node:test";

import { resolveHostJoinUrlFromListing, watchHostJoinUrl } from "./index";

const location = { protocol: "http:", port: "5173" };

test("does put the host token in the tablet's URL when the laptop's listing carries one", () => {
  assert.equal(
    resolveHostJoinUrlFromListing(location, {
      addresses: ["192.168.1.23", 7],
      hostControlToken: "abc_DEF-123"
    }),
    "http://192.168.1.23:5173/host?hostToken=abc_DEF-123"
  );
});

test("does offer no code when the listing is not a host-join answer", () => {
  assert.equal(resolveHostJoinUrlFromListing(location, null), null);
  assert.equal(resolveHostJoinUrlFromListing(location, { addresses: ["192.168.1.23"] }), null);
  assert.equal(resolveHostJoinUrlFromListing(location, { error: "host_join_laptop_only" }), null);
  assert.equal(
    resolveHostJoinUrlFromListing(location, { addresses: [], hostControlToken: "abc" }),
    null
  );
});

type FakeClock = {
  timers: { setInterval: (run: () => void, ms: number) => unknown; clearInterval: (handle: unknown) => void };
  tick: () => void;
  isCleared: () => boolean;
};

const createClock = (): FakeClock => {
  let scheduled: (() => void) | null = null;

  return {
    timers: {
      setInterval: (run) => {
        scheduled = run;
        return 1;
      },
      clearInterval: () => {
        scheduled = null;
      }
    },
    tick: () => scheduled?.(),
    isCleared: () => scheduled === null
  };
};

const settle = (): Promise<void> => new Promise((resolve) => setImmediate(resolve));

test("does keep the card current when the server's answer changes between ticks", async () => {
  const answers = ["http://10.0.0.4:5173/host?hostToken=a", "http://10.0.0.4:5173/host?hostToken=b"];
  const shown: (string | null)[] = [];
  const clock = createClock();
  let calls = 0;

  watchHostJoinUrl({
    load: async () => answers[Math.min(calls++, answers.length - 1)] ?? null,
    onChange: (url) => shown.push(url),
    timers: clock.timers,
    focusTarget: new EventTarget()
  });
  await settle();
  clock.tick();
  await settle();
  clock.tick();
  await settle();

  assert.deepEqual(shown, answers);
});

test("does recover the card when the first ask failed because the server was not up yet", async () => {
  const shown: (string | null)[] = [];
  const clock = createClock();
  let serverUp = false;

  watchHostJoinUrl({
    load: async () => {
      if (!serverUp) {
        throw new Error("connection refused");
      }
      return "http://10.0.0.4:5173/host?hostToken=a";
    },
    onChange: (url) => shown.push(url),
    timers: clock.timers,
    focusTarget: new EventTarget()
  });
  await settle();
  assert.deepEqual(shown, []);

  serverUp = true;
  clock.tick();
  await settle();

  assert.deepEqual(shown, ["http://10.0.0.4:5173/host?hostToken=a"]);
});

test("does keep the card it has when a later ask fails mid-restart", async () => {
  const shown: (string | null)[] = [];
  const clock = createClock();
  let fail = false;

  watchHostJoinUrl({
    load: async () => {
      if (fail) {
        throw new Error("connection refused");
      }
      return "http://10.0.0.4:5173/host?hostToken=a";
    },
    onChange: (url) => shown.push(url),
    timers: clock.timers,
    focusTarget: new EventTarget()
  });
  await settle();
  fail = true;
  clock.tick();
  await settle();

  assert.deepEqual(shown, ["http://10.0.0.4:5173/host?hostToken=a"]);
});

test("does ask again when the laptop window regains focus", async () => {
  const focusTarget = new EventTarget();
  let calls = 0;

  watchHostJoinUrl({
    load: async () => {
      calls += 1;
      return null;
    },
    onChange: () => {},
    timers: createClock().timers,
    focusTarget
  });
  focusTarget.dispatchEvent(new Event("focus"));
  await settle();

  assert.equal(calls, 2);
});

test("does stop asking when it is unwatched", async () => {
  const focusTarget = new EventTarget();
  const clock = createClock();
  let calls = 0;

  const stop = watchHostJoinUrl({
    load: async () => {
      calls += 1;
      return null;
    },
    onChange: () => {},
    timers: clock.timers,
    focusTarget
  });
  stop();
  focusTarget.dispatchEvent(new Event("focus"));
  clock.tick();

  assert.equal(calls, 1);
  assert.equal(clock.isCleared(), true);
});
