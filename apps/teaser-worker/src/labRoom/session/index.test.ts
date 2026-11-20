import assert from "node:assert/strict";
import test from "node:test";

import {
  LAB_FRAME_EVERY_TICKS,
  advanceLabSession,
  closeLabSocket,
  createLabSession,
  openLabSocket,
  receiveLabMessage
} from "./index.ts";

const hello = (padId: string): string => JSON.stringify({ t: "hello", padId });
const pad = (seq: number, dir: number, jumpSeq: number): string => JSON.stringify({ t: "pad", seq, dir, jumpSeq });

test("does give the first four phones a hen each and seats the fifth as a watcher when the room fills", () => {
  const session = createLabSession();
  const slots: (number | null)[] = [];

  for (const index of [1, 2, 3, 4, 5]) {
    openLabSocket(session, `s${index}`, 0);

    const { reply } = receiveLabMessage(session, `s${index}`, hello(`pad-${index}`), 0);
    const welcome = reply.find((message) => message.t === "welcome");

    slots.push(welcome?.t === "welcome" ? welcome.slot : -1);
  }

  assert.deepEqual(slots, [0, 1, 2, 3, null]);
  assert.equal(session.world.hens.length, 4);
});

test("does refuse a seventh socket when six are open", () => {
  const session = createLabSession();

  for (const index of [1, 2, 3, 4, 5, 6]) {
    assert.equal(openLabSocket(session, `s${index}`, 0), true);
  }

  assert.equal(openLabSocket(session, "s7", 0), false);
});

test("does apply a pad message and broadcast a frame that acknowledges it when the seq is new", () => {
  const session = createLabSession();

  openLabSocket(session, "s1", 0);
  receiveLabMessage(session, "s1", hello("pad-a"), 0);

  const { broadcast } = receiveLabMessage(session, "s1", pad(1, 1, 0), 10);
  const frame = broadcast[0];

  assert.equal(frame?.t, "frame");
  assert.deepEqual(frame?.t === "frame" ? frame.acks : null, { "pad-a": 1 });
  assert.equal(session.world.hens[0]?.dir, 1);
});

test("does ignore a pad message whose seq it has already applied", () => {
  const session = createLabSession();

  openLabSocket(session, "s1", 0);
  receiveLabMessage(session, "s1", hello("pad-a"), 0);
  receiveLabMessage(session, "s1", pad(2, 1, 0), 10);

  const { broadcast } = receiveLabMessage(session, "s1", pad(1, 5, 0), 20);

  assert.equal(broadcast.length, 0);
  assert.equal(session.world.hens[0]?.dir, 1);
});

test("does refuse a malformed message without throwing", () => {
  const session = createLabSession();

  openLabSocket(session, "s1", 0);

  for (const raw of ["not json", "[]", JSON.stringify({ t: "pad", seq: -1, dir: 1, jumpSeq: 0 }), "x".repeat(300)]) {
    const { reply } = receiveLabMessage(session, "s1", raw, 0);

    assert.deepEqual(reply, [{ t: "refused", reason: "malformed" }]);
  }
});

test("does refuse messages past the burst when a phone floods the room", () => {
  const session = createLabSession();

  openLabSocket(session, "s1", 0);

  const replies = Array.from({ length: 60 }, (_, index) =>
    receiveLabMessage(session, "s1", JSON.stringify({ t: "ping", id: index, sentAt: 0 }), 0).reply[0]
  );

  assert.equal(replies.filter((message) => message?.t === "pong").length, 40);
  assert.equal(replies.filter((message) => message?.t === "refused").length, 20);
});

test("does take a hen out of the yard when its only socket closes", () => {
  const session = createLabSession();

  openLabSocket(session, "s1", 0);
  receiveLabMessage(session, "s1", hello("pad-a"), 0);
  closeLabSocket(session, "s1");

  assert.equal(session.world.hens.length, 0);
});

test("does keep one hen when the same pad says hello on a second socket before the first closes", () => {
  const session = createLabSession();

  openLabSocket(session, "s1", 0);
  receiveLabMessage(session, "s1", hello("pad-a"), 0);
  openLabSocket(session, "s2", 0);
  receiveLabMessage(session, "s2", hello("pad-a"), 0);
  closeLabSocket(session, "s1");

  assert.equal(session.world.hens.length, 1);
});

test("does step sixty ticks a second and send a frame every few ticks when the clock runs", () => {
  const session = createLabSession();
  let frames = 0;

  openLabSocket(session, "s1", 0);
  receiveLabMessage(session, "s1", hello("pad-a"), 0);

  for (let nowMs = 0; nowMs <= 1000; nowMs += 16) {
    if (advanceLabSession(session, nowMs) !== null) {
      frames += 1;
    }
  }

  assert.ok(Math.abs(session.world.tick - 60) <= 1, `tick ${session.world.tick}`);
  assert.ok(Math.abs(frames - 60 / LAB_FRAME_EVERY_TICKS) <= 2, `frames ${frames}`);
});
