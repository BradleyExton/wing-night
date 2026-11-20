import assert from "node:assert/strict";
import test from "node:test";

import { isTeaserRoomCode, parseTeaserRoomClientMessage } from "./index.js";

test("does read each kind of phone message when it is well formed", () => {
  assert.deepEqual(parseTeaserRoomClientMessage('{"t":"hello","clientId":"tab-1a2b"}'), { t: "hello", clientId: "tab-1a2b" });
  assert.deepEqual(parseTeaserRoomClientMessage('{"t":"seat","playerId":"player-7"}'), { t: "seat", playerId: "player-7" });
  assert.deepEqual(parseTeaserRoomClientMessage('{"t":"seat","playerId":null}'), { t: "seat", playerId: null });
  assert.deepEqual(parseTeaserRoomClientMessage('{"t":"start"}'), { t: "start" });
  assert.deepEqual(parseTeaserRoomClientMessage('{"t":"action","actionType":"walk","actionPayload":{"dir":3}}'), {
    t: "action",
    actionType: "walk",
    actionPayload: { dir: 3 }
  });
  assert.deepEqual(parseTeaserRoomClientMessage('{"t":"ping","id":4,"sentAt":12.5}'), { t: "ping", id: 4, sentAt: 12.5 });
});

test("does refuse anything that is not a phone message without throwing", () => {
  for (const raw of [
    "not json",
    "[]",
    '{"t":"nope"}',
    '{"t":"hello","clientId":"Has Spaces"}',
    '{"t":"seat","playerId":7}',
    '{"t":"action","actionType":"walk","actionPayload":[]}',
    '{"t":"action","actionType":"walk; drop","actionPayload":{}}',
    '{"t":"ping","id":-1,"sentAt":0}',
    `{"t":"start","pad":"${"x".repeat(600)}"}`
  ]) {
    assert.equal(parseTeaserRoomClientMessage(raw), null, raw.slice(0, 40));
  }
});

test("does accept a room code of four to six capitals only", () => {
  assert.equal(isTeaserRoomCode("ABCD"), true);
  assert.equal(isTeaserRoomCode("ABCDEF"), true);
  assert.equal(isTeaserRoomCode("abcd"), false);
  assert.equal(isTeaserRoomCode("ABC"), false);
  assert.equal(isTeaserRoomCode("ABCD/../X"), false);
});
