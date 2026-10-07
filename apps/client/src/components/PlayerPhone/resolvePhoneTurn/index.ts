import {
  CONTESTANT_CONTROLLERS,
  Phase,
  type MinigameDeviceMode,
  type PlayerRoomStateSnapshot
} from "@wingnight/shared";

// What this phone is for during its own team's arcade turn. Only the contestant's phone ever
// shows the game; every other phone on the team is told where to look. Null outside the team's
// turn, which leaves the phone on its idle card.
export type PhoneTurn =
  // The leg in hand is this player's, and this phone holds it: draw the game.
  | { role: "play"; legIndex: number; previousPlayerId: string | null }
  // This player's leg comes after the one in hand.
  | { role: "next"; deviceMode: MinigameDeviceMode; contestantPlayerId: string | null }
  // This player's leg, but the tablet holds it — tablet mode, taken back, or begun on the tablet.
  | { role: "tablet" }
  // The team is up and this player is neither on nor next: eyes on the TV.
  | { role: "watch"; contestantPlayerId: string | null }
  // The team's briefing: what to pick up when it ends.
  | { role: "briefing"; deviceMode: MinigameDeviceMode };

type PhoneTurnRoom = Pick<
  PlayerRoomStateSnapshot,
  "phase" | "teams" | "activeRoundTeamId" | "activeTurnTeamId" | "contestantTurn"
>;

// The turn's team: the round cursor's, the precedence the room's music and the rail share.
export const resolveTurnTeamId = (room: Pick<PhoneTurnRoom, "activeRoundTeamId" | "activeTurnTeamId">): string | null => {
  return room.activeRoundTeamId ?? room.activeTurnTeamId;
};

export const resolvePhoneTurn = (
  room: PhoneTurnRoom,
  playerId: string,
  // Who held the leg before this one, as this phone last saw it — the name its handoff hold says.
  previousPlayerId: string | null
): PhoneTurn | null => {
  const turn = room.contestantTurn;
  const team = room.teams.find((candidate) => candidate.playerIds.includes(playerId)) ?? null;

  if (turn === null || team === null || team.id !== resolveTurnTeamId(room)) {
    return null;
  }

  if (room.phase === Phase.MINIGAME_INTRO) {
    return { role: "briefing", deviceMode: turn.deviceMode };
  }

  if (room.phase !== Phase.MINIGAME_PLAY || turn.legIndex === null) {
    return { role: "watch", contestantPlayerId: null };
  }

  if (turn.contestantPlayerId === playerId) {
    // A phone the server saw drop still owns the leg it was flying — nobody else may write its
    // log until the host takes it back — so a phone back from a Wi-Fi blink keeps its game, the
    // same runner and the same log, instead of being handed a card and then a fresh runner.
    const isPhonesLeg = turn.controller === CONTESTANT_CONTROLLERS.PHONE || turn.droppedPlayerId === playerId;

    return isPhonesLeg ? { role: "play", legIndex: turn.legIndex, previousPlayerId } : { role: "tablet" };
  }

  if (turn.nextContestantPlayerId === playerId) {
    return { role: "next", deviceMode: turn.deviceMode, contestantPlayerId: turn.contestantPlayerId };
  }

  return { role: "watch", contestantPlayerId: turn.contestantPlayerId };
};
