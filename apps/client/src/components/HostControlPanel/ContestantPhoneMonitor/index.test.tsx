import assert from "node:assert/strict";
import test from "node:test";
import { fappyDevManifest } from "@wingnight/minigames-fappy/dev";
import { fappyRuntimePlugin } from "@wingnight/minigames-fappy/runtime";
import type { ContestantTurn, MinigameDisplayView } from "@wingnight/shared";

import { buildNoopHostHandlers, renderHostMarkup } from "../../../testSupport/renderWithProviders";
import { buildRoomState } from "../../../testSupport/roomStateFixtures";
import { ContestantPhoneMonitor } from "./index";

const PHONE_TURN: ContestantTurn = {
  minigame: "FAPPY",
  deviceMode: "phones",
  legIndex: 0,
  contestantPlayerId: "player-1",
  nextContestantPlayerId: null,
  controller: "phone",
  tabletLegIndexes: [],
  droppedPlayerId: null
};

const fappyDisplayView = (): MinigameDisplayView | null => {
  const state = fappyRuntimePlugin.initialize({
    teamIds: fappyDevManifest.teamIds,
    players: fappyDevManifest.players,
    teams: fappyDevManifest.teams,
    activeRoundTeamId: fappyDevManifest.activeRoundTeamId,
    pointsMax: fappyDevManifest.pointsMax,
    pendingPointsByTeamId: fappyDevManifest.pendingPointsByTeamId,
    rules: fappyDevManifest.rules,
    content: fappyDevManifest.content
  });

  return state === null
    ? null
    : fappyRuntimePlugin.selectDisplayView({ state, rules: fappyDevManifest.rules, content: fappyDevManifest.content });
};

const render = (turn: ContestantTurn, minigameDisplayView: MinigameDisplayView | null = null): string =>
  renderHostMarkup(<ContestantPhoneMonitor turn={turn} activeTeamName="Team Alpha" />, {
    roomState: buildRoomState({ minigameDisplayView, contestantTurn: turn }),
    handlers: buildNoopHostHandlers({ onTakeBackContestantLeg: () => undefined })
  });

test("does mirror the TV and keep every hatch when a contestant's phone holds the leg", () => {
  const html = render(PHONE_TURN, fappyDisplayView());

  assert.match(html, /data-contestant-monitor="phone"[^>]*>On Alex&#x27;s phone</);
  assert.match(html, /data-contestant-mirror="FAPPY"/);
  assert.match(html, /data-fappy-scene="display-fappy"/);
  // The tablet runs no game of its own while the phone writes the leg's log.
  assert.doesNotMatch(html, /data-fappy-scene="host-fappy"/);
  assert.match(html, />Take it back</);
  assert.match(html, />Skip leg</);
  assert.match(html, />Reset turn</);
  assert.doesNotMatch(html, /data-contestant-dropped/);
});

test("does put the take-back prompt over the mirror when the contestant's phone dropped", () => {
  const html = render({ ...PHONE_TURN, controller: "tablet", droppedPlayerId: "player-1" });

  assert.match(html, /data-contestant-monitor="dropped"[^>]*>Alex&#x27;s phone dropped</);
  assert.match(html, /data-contestant-dropped="player-1"/);
  assert.match(html, /The leg waits\. Take it back and finish it on the tablet\./);
  // One take-back, on the prompt, not a second in the actions row.
  assert.equal((html.match(/data-contestant-take-back/g) ?? []).length, 1);
});

test("does hold Take it back and the skip for the handoff beat when the monitor opens on a handed-over leg", () => {
  const html = render({ ...PHONE_TURN, legIndex: 1 }, fappyDisplayView());

  assert.match(html, /disabled=""[^>]*data-contestant-take-back/);
  assert.match(html, /disabled=""[^>]*>Skip leg</);
  assert.doesNotMatch(html, /disabled=""[^>]*>Reset turn</);
});
