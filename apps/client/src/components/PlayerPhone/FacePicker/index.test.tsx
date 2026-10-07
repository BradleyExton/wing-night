import assert from "node:assert/strict";
import test from "node:test";
import { PLAYER_CLAIM_REFUSAL_REASONS, type Player } from "@wingnight/shared";
import { renderToStaticMarkup } from "react-dom/server";

import { FacePicker } from "./index";

const PLAYERS: Player[] = [
  { id: "player-1", name: "Brad" },
  { id: "player-2", name: "Rob" },
  { id: "player-3", name: "Kim" }
];

const render = (overrides: Partial<Parameters<typeof FacePicker>[0]> = {}): string =>
  renderToStaticMarkup(
    <FacePicker
      players={PLAYERS}
      claimedPlayerIds={[]}
      teamThemeByPlayerId={new Map()}
      serverOrigin={null}
      claimingPlayerId={null}
      refusal={null}
      onClaim={(): void => undefined}
      {...overrides}
    />
  );

// The tag of the one face button whose data attribute names `playerId`.
const faceButton = (html: string, playerId: string): string => {
  const match = html.match(new RegExp(`<button[^>]*data-face-player-id="${playerId}"[^>]*>`));

  assert.ok(match, `no face for ${playerId}`);

  return match[0];
};

test("does grey and lock a face when another phone has claimed it", () => {
  const html = render({ claimedPlayerIds: ["player-2"] });

  assert.match(faceButton(html, "player-2"), /disabled=""/);
  assert.match(faceButton(html, "player-2"), /data-face-taken="true"/);
  assert.match(faceButton(html, "player-2"), /aria-label="Rob is taken"/);
  assert.doesNotMatch(faceButton(html, "player-1"), /disabled=""/);
  assert.match(faceButton(html, "player-1"), /aria-label="I&#x27;m Brad"/);
  assert.equal(html.match(/Taken</g)?.length, 1);
});

test("does hold every face still while a claim is in flight", () => {
  const html = render({ claimingPlayerId: "player-3" });

  for (const player of PLAYERS) {
    assert.match(faceButton(html, player.id), /disabled=""/);
  }

  assert.match(faceButton(html, "player-3"), /aria-pressed="true"/);
});

test("does say why when the last claim was refused", () => {
  const html = render({ refusal: PLAYER_CLAIM_REFUSAL_REASONS.ALREADY_CLAIMED });

  assert.match(html, /role="alert"/);
  assert.match(html, /Someone just took that face/);
});

test("does ask the guest to wait when the roster is empty", () => {
  const html = render({ players: [] });

  assert.match(html, /hasn&#x27;t loaded tonight&#x27;s roster/);
  assert.doesNotMatch(html, /data-face-player-id/);
});

test("does keep this phone's own claimed face tappable", () => {
  const html = render({ claimedPlayerIds: ["player-1", "player-2"], ownPlayerId: "player-1" });

  assert.doesNotMatch(faceButton(html, "player-1"), /disabled=""/);
  assert.match(faceButton(html, "player-1"), /data-face-taken="false"/);
  assert.match(faceButton(html, "player-2"), /disabled=""/);
});
