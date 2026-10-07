import assert from "node:assert/strict";
import test from "node:test";
import type { RoleScopedStateSnapshotEnvelope } from "@wingnight/shared";
import { renderToStaticMarkup } from "react-dom/server";

import { RoomStateProvider } from "../../context/RoomStateContext";
import type { ContestantLegController } from "../../utils/contestantLeg";
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
    claimedPlayerIds: ["player-1"],
    contestantTurn: null,
    spectatorBets: null
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

const render = (
  seat: PlayerSeatController | null,
  envelope: RoleScopedStateSnapshotEnvelope = ENVELOPE,
  contestantLeg: ContestantLegController | null = null
): string =>
  renderToStaticMarkup(
    <RoomStateProvider value={envelope}>
      <PlayerPhone seat={seat} contestantLeg={contestantLeg} />
    </RoomStateProvider>
  );

// Spice Girls' FAPPY relay on phones: Rob flying leg 1 on his phone, Brad after him.
const PHONES_TURN_ENVELOPE = {
  clientRole: "PLAYER",
  roomState: {
    ...ENVELOPE.roomState,
    phase: "MINIGAME_PLAY",
    teams: [{ id: "team-1", name: "Spice Girls", playerIds: ["player-2", "player-1"], totalScore: 0 }],
    activeRoundTeamId: "team-1",
    activeTurnTeamId: null,
    claimedPlayerIds: ["player-1", "player-2"],
    contestantTurn: {
      minigame: "FAPPY",
      deviceMode: "phones",
      legIndex: 0,
      contestantPlayerId: "player-2",
      nextContestantPlayerId: "player-1",
      controller: "phone",
      tabletLegIndexes: [],
      droppedPlayerId: null
    }
  }
} as RoleScopedStateSnapshotEnvelope;

const holdingNoView: ContestantLegController = {
  getHostView: () => null,
  subscribe: () => () => undefined,
  dispatch: () => undefined,
  forgetHostView: () => undefined,
  dispose: () => undefined
};

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

test("does draw the game frame, not a card, on the contestant's phone when its phone holds the leg", () => {
  const html = render(seatIn({ status: "seated", playerId: "player-2", confirmed: true }), PHONES_TURN_ENVELOPE, holdingNoView);

  assert.match(html, /data-contestant-game="waiting"/);
  assert.match(html, /data-contestant-leg="0"/);
  assert.match(html, /You&#x27;re first/);
  assert.doesNotMatch(html, /data-player-idle/);
});

test("does tell the next teammate they are next and never draw the game on their phone", () => {
  const html = render(seatIn({ status: "seated", playerId: "player-1", confirmed: true }), PHONES_TURN_ENVELOPE, holdingNoView);

  assert.match(html, /data-contestant-phone="next"/);
  assert.match(html, /You&#x27;re next/);
  assert.match(html, /After Rob/);
  assert.doesNotMatch(html, /data-contestant-game/);
});

// Spice Girls (Rob) are briefed; Brad sits on Molten Metal and watches with his phone.
const BETS_OPEN_ENVELOPE = {
  clientRole: "PLAYER",
  roomState: {
    ...ENVELOPE.roomState,
    phase: "MINIGAME_INTRO",
    teams: [
      { id: "team-1", name: "Spice Girls", playerIds: ["player-2"], totalScore: 0 },
      { id: "team-2", name: "Molten Metal", playerIds: ["player-1"], totalScore: 0 }
    ],
    activeRoundTeamId: "team-1",
    claimedPlayerIds: ["player-1", "player-2"],
    spectatorBets: {
      turnKey: "1:0",
      teamId: "team-1",
      line: 7.5,
      baselinePoints: 0,
      status: "open",
      betsByPlayerId: {},
      bettorPlayerIds: [],
      betCount: 0,
      turnPoints: null,
      outcome: null
    }
  }
} as RoleScopedStateSnapshotEnvelope;

test("does give a watcher off the playing team the bet card when the window is open", () => {
  const html = render(seatIn({ status: "seated", playerId: "player-1", confirmed: true }), BETS_OPEN_ENVELOPE);

  assert.match(html, /data-spectator-bet="open"/);
  assert.match(html, /Side bet · Spice Girls/);
  assert.doesNotMatch(html, /data-player-idle/);
});

test("does keep the playing team's phone off the bet card when its team is up", () => {
  const html = render(seatIn({ status: "seated", playerId: "player-2", confirmed: true }), BETS_OPEN_ENVELOPE);

  assert.doesNotMatch(html, /data-spectator-bet/);
  assert.match(html, /data-player-idle="player-2"/);
});

test("does keep an arcade team's phones on their own turn cards when the other teams are betting", () => {
  const envelope = {
    clientRole: "PLAYER",
    roomState: {
      ...PHONES_TURN_ENVELOPE.roomState,
      spectatorBets: { ...BETS_OPEN_ENVELOPE.roomState.spectatorBets, status: "closed" }
    }
  } as RoleScopedStateSnapshotEnvelope;
  const html = render(seatIn({ status: "seated", playerId: "player-1", confirmed: true }), envelope, holdingNoView);

  assert.match(html, /data-contestant-phone="next"/);
  assert.doesNotMatch(html, /data-spectator-bet/);
});
