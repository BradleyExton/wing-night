import assert from "node:assert/strict";
import test from "node:test";
import { MINIGAME_TYPES, Phase, SESSION_MODES, type RoomState } from "@wingnight/shared";

import { formatMinigameName } from "../../copy/formatters";
import { buildNoopHostHandlers, renderHostMarkup } from "../../testSupport/renderWithProviders";
import { buildRoomState } from "../../testSupport/roomStateFixtures";
import { QuickPlayLauncher } from "./index";

const escapeApostrophes = (text: string): string => text.replaceAll("'", "&#x27;");

const renderLauncher = (roomState: RoomState | null): string => {
  return renderHostMarkup(<QuickPlayLauncher />, {
    roomState,
    handlers: buildNoopHostHandlers({ onStartQuickPlay: (): void => undefined })
  });
};

test("renders the roster, the teams and every registered game from SETUP", () => {
  const html = renderLauncher(buildRoomState({ phase: Phase.SETUP }));

  assert.match(html, /Just the games\./);
  assert.match(html, /Toggle Alex/);
  assert.match(html, /Toggle Morgan/);
  assert.match(html, /Team Alpha/);
  assert.match(html, /Team Beta/);

  for (const minigameType of MINIGAME_TYPES) {
    assert.ok(
      html.includes(escapeApostrophes(`Queue ${formatMinigameName(minigameType)}`)),
      `missing queue toggle for ${minigameType}`
    );
  }
});

test("renders Start dark with the first blocker while nothing is queued", () => {
  const html = renderLauncher(buildRoomState({ phase: Phase.SETUP }));

  assert.match(html, /Queue at least one mini-game\./);

  const startButtonTag = html.match(/<button[^>]*data-quick-play-start[^>]*>/)?.[0] ?? "";
  assert.match(startButtonTag, /disabled=""/);
});

test("renders the waiting line before the first snapshot", () => {
  const html = renderLauncher(null);

  assert.match(html, /Waiting for the room/);
  assert.doesNotMatch(html, /Start Quick Play/);
});

test("renders the in-progress notice instead of the launcher once the night is running", () => {
  const html = renderLauncher(buildRoomState({ phase: Phase.EATING }));

  assert.match(html, /The room is mid-game\./);
  assert.match(html, /Reset room to setup/);
  assert.match(html, /href="\/host"/);
  assert.doesNotMatch(html, /Toggle Alex/);
});

test("renders the handoff line once Quick Play is running", () => {
  const html = renderLauncher(
    buildRoomState({ phase: Phase.MINIGAME_INTRO, sessionMode: SESSION_MODES.QUICK_PLAY })
  );

  assert.match(html, /Heading to the Host Controller/);
  assert.doesNotMatch(html, /The room is mid-game/);
});

test("renders the fatal content state over everything else", () => {
  const html = renderLauncher(
    buildRoomState({
      phase: Phase.SETUP,
      fatalError: { code: "CONTENT_LOAD_FAILED", message: "Bad pack." }
    })
  );

  assert.match(html, /Content Load Error/);
  assert.doesNotMatch(html, /Just the games/);
});

test("asks for more teams when the pack has fewer than two", () => {
  const html = renderLauncher(
    buildRoomState({
      phase: Phase.SETUP,
      teams: [{ id: "team-solo", name: "Solo", playerIds: [], totalScore: 0 }]
    })
  );

  assert.match(html, /fewer than two teams/);
  assert.doesNotMatch(html, /Toggle Alex/);
});
