import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import type { EmojiCharadesMinigameHostView } from "@wingnight/shared";

import { HostEmojiCharadesSurface } from "./index.js";

const TEAM_NAMES = new Map([
  ["team-1", "Team Heat"],
  ["team-2", "Team Chill"]
]);

const playingView = (
  overrides: Partial<Extract<
    EmojiCharadesMinigameHostView,
    { status: "playing" }
  >> = {}
): EmojiCharadesMinigameHostView => ({
  minigame: "EMOJI_CHARADES",
  activeTurnTeamId: "team-1",
  pendingPointsByTeamId: { "team-1": 3, "team-2": 1 },
  status: "playing",
  currentSubject: { id: "titanic", text: "Titanic", lockedEmojis: null },
  emojiSequence: ["🚢", "🧊"],
  subjectsRemaining: 4,
  reveal: null,
  ...overrides
});

const turnCompleteView = (): EmojiCharadesMinigameHostView => ({
  minigame: "EMOJI_CHARADES",
  activeTurnTeamId: "team-1",
  pendingPointsByTeamId: { "team-1": 3 },
  status: "turn_complete",
  reveal: null
});

const renderSurface = (
  view: EmojiCharadesMinigameHostView | null,
  phase: "intro" | "play" = "play",
  canDispatchAction = true
): string => {
  return renderToStaticMarkup(
    <HostEmojiCharadesSurface
      phase={phase}
      minigameType="EMOJI_CHARADES"
      minigameHostView={view}
      activeTeamName="Team Heat"
      teamNameByTeamId={TEAM_NAMES}
      rail={<header>rail</header>}
      clock={<div>1:30</div>}
      canDispatchAction={canDispatchAction}
      onDispatchAction={(): void => {}}
      serverOrigin={null}
    />
  );
};

const buttonFor = (html: string, label: string): string | null => {
  const buttons = html.match(/<button[^>]*>[\s\S]*?<\/button>/g) ?? [];

  return buttons.find((button) => button.includes(label)) ?? null;
};

// Matches the ATTRIBUTE, not the word: every control carries
// `disabled:opacity-40` in its class list, so a substring check on "disabled"
// reports every button as disabled and quietly passes the whole suite.
const isDisabled = (html: string, label: string): boolean => {
  const button = buttonFor(html, label);

  assert.notEqual(button, null, `expected a "${label}" button`);
  return /<button[^>]*\sdisabled=""/.test(button ?? "");
};

test("forwards the shell's rail and clock on every play status", () => {
  for (const view of [playingView(), turnCompleteView(), null]) {
    const html = renderSurface(view);

    assert.match(html, /<header>rail<\/header>/);
    assert.match(html, /1:30/);
  }
});

test("renders no rail and no team chip of its own", () => {
  const html = renderSurface(playingView());
  const headers = html.match(/<header/g) ?? [];

  assert.equal(headers.length, 1);
  assert.doesNotMatch(html, /Team Heat/);
});

test("puts the subject and both verdicts beside the picker while playing", () => {
  const html = renderSurface(playingView());

  assert.match(html, /Titanic/);
  assert.equal(isDisabled(html, "Got it"), false);
  assert.equal(isDisabled(html, "Skip"), false);
});

test("counts the subjects left and the points banked in the rail row", () => {
  const html = renderSurface(playingView());

  assert.match(html, /4 subjects left/);
  assert.match(html, /\+3 pending/);
});

test("hides the pending chip until the turn has banked something", () => {
  const html = renderSurface(
    playingView({ pendingPointsByTeamId: { "team-1": 0 } })
  );

  assert.doesNotMatch(html, /pending/);
});

test("offers back and clear only once the clue has an emoji in it", () => {
  assert.equal(isDisabled(renderSurface(playingView()), "Back"), false);

  const empty = renderSurface(playingView({ emojiSequence: [] }));

  assert.equal(isDisabled(empty, "Back"), true);
  assert.equal(isDisabled(empty, "Clear"), true);
  assert.match(empty, /Tap emoji to start the clue/);
});

test("refuses both verdicts when the deck has run dry mid-turn", () => {
  const html = renderSurface(playingView({ currentSubject: null }));

  assert.equal(isDisabled(html, "Got it"), true);
  assert.equal(isDisabled(html, "Skip"), true);
  assert.match(html, /Waiting for the next subject/);
});

test("drops the search and the tabs for a subject locked to its own emoji", () => {
  const html = renderSurface(
    playingView({
      currentSubject: {
        id: "rob-barnes",
        text: "Rob Barnes",
        lockedEmojis: ["🥯", "🍷"]
      }
    })
  );

  assert.match(html, /Rob Barnes only ever picks these/);
  assert.doesNotMatch(html, /Search all emoji/);
  assert.equal(buttonFor(html, "role=\"tab\""), null);
});

test("gives the finished turn the whole canvas and nothing to press", () => {
  const html = renderSurface(turnCompleteView());

  assert.match(html, /Turn complete/);
  assert.equal(buttonFor(html, "Got it"), null);
  assert.doesNotMatch(html, /subjects left/);
});

test("waits rather than claiming a finished turn when no view has arrived", () => {
  const html = renderSurface(null);

  assert.match(html, /Waiting for the next subject/);
  assert.doesNotMatch(html, /Turn complete/);
});

test("disables every control when the host cannot act", () => {
  const html = renderSurface(playingView(), "play", false);

  assert.equal(isDisabled(html, "Got it"), true);
  assert.equal(isDisabled(html, "Skip"), true);
  assert.equal(isDisabled(html, "Back"), true);
});

test("shows the subject but no takeover chrome during the intro", () => {
  const html = renderSurface(playingView(), "intro");

  assert.match(html, /Titanic/);
  assert.doesNotMatch(html, /<header>rail<\/header>/);
  assert.equal(buttonFor(html, "Got it"), null);
});
