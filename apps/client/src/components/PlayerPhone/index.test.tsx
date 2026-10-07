import assert from "node:assert/strict";
import test from "node:test";
import type { RoleScopedStateSnapshotEnvelope } from "@wingnight/shared";
import { renderToStaticMarkup } from "react-dom/server";

import { RoomStateProvider } from "../../context/RoomStateContext";
import type { PlayerSeatController, PlayerSeatState } from "../../utils/playerSeat";
import { PlayerPhone } from "./index";

const ENVELOPE: RoleScopedStateSnapshotEnvelope = {
  clientRole: "PLAYER",
  roomState: {
    phase: "SETUP",
    sessionMode: "NIGHT",
    currentRound: 0,
    totalRounds: 3,
    players: [
      { id: "player-1", name: "Brad" },
      { id: "player-2", name: "Rob" }
    ],
    teams: [{ id: "team-1", name: "Spice Girls", playerIds: ["player-2"], totalScore: 0 }],
    turnOrderTeamIds: [],
    activeRoundTeamId: null,
    activeTurnTeamId: null,
    claimedPlayerIds: ["player-1"]
  }
} as RoleScopedStateSnapshotEnvelope;

const seatIn = (state: PlayerSeatState): PlayerSeatController => ({
  getState: () => state,
  subscribe: () => () => undefined,
  claim: () => undefined,
  release: () => undefined,
  backToPicker: () => undefined,
  dispose: () => undefined
});

const render = (seat: PlayerSeatController | null): string =>
  renderToStaticMarkup(
    <RoomStateProvider value={ENVELOPE}>
      <PlayerPhone seat={seat} />
    </RoomStateProvider>
  );

test("does send the guest to the TV when the phone has no seat", () => {
  const html = render(null);

  assert.match(html, /data-player-seat-status="locked"/);
  assert.match(html, /Scan the code on the TV/);
});

test("does show the picker and the room's count when the phone is choosing", () => {
  const html = render(seatIn({ status: "picking", claimingPlayerId: null, refusal: null, ownPlayerId: null }));

  assert.match(html, /Tap your face/);
  assert.match(html, /1 of 2 in/);
});

test("does show who the phone is and their team when it is seated", () => {
  const html = render(seatIn({ status: "seated", playerId: "player-2", confirmed: true }));

  assert.match(html, /data-player-idle="player-2"/);
  assert.match(html, /data-player-self="player-2"/);
  assert.match(html, /Spice Girls/);
  assert.match(html, /This isn&#x27;t me/);
});

test("does say a seated guest is not on a team yet when the tablet has not seated them", () => {
  const html = render(seatIn({ status: "seated", playerId: "player-1", confirmed: false }));

  assert.match(html, /Not on a team yet/);
  // Seated from storage only: the server has not re-bound it yet.
  assert.doesNotMatch(html, /data-player-self/);
});

test("does offer the picker again when the host freed the face", () => {
  const html = render(seatIn({ status: "claim_gone", playerId: "player-1", reason: "released_by_host" }));

  assert.match(html, /data-player-claim-gone="released_by_host"/);
  assert.match(html, /Pick your face/);
});

test("does offer to play here when the face moved to another screen", () => {
  const html = render(seatIn({ status: "claim_gone", playerId: "player-1", reason: "superseded" }));

  assert.match(html, /Play on this phone/);
});
