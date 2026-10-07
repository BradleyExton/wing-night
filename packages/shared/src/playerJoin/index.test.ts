import assert from "node:assert/strict";
import test from "node:test";

import {
  PLAYER_CLAIM_GONE_REASONS,
  isPlayerClaimGoneReason,
  readPlayerHandshake
} from "./index.js";

test("does read the join token and claim secret when the handshake carries both", () => {
  assert.deepEqual(
    readPlayerHandshake({ clientRole: "PLAYER", joinToken: "tok", claimSecret: "sec" }),
    { joinToken: "tok", claimSecret: "sec" }
  );
});

test("does read nothing when the handshake fields are blank, missing or the wrong type", () => {
  for (const auth of [null, "PLAYER", [], { joinToken: "  ", claimSecret: 7 }, {}]) {
    assert.deepEqual(readPlayerHandshake(auth), { joinToken: null, claimSecret: null });
  }
});

test("does recognise every claim-gone reason and nothing else", () => {
  for (const reason of Object.values(PLAYER_CLAIM_GONE_REASONS)) {
    assert.equal(isPlayerClaimGoneReason(reason), true);
  }

  assert.equal(isPlayerClaimGoneReason("kicked"), false);
  assert.equal(isPlayerClaimGoneReason(undefined), false);
});
