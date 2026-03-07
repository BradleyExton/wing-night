import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import type { MinigameBriefingContent } from "../../../../copy/minigameBriefings";
import { MinigameIntroStageBody } from "./index";

const briefingContentFixture: MinigameBriefingContent = {
  displayName: "Trivia",
  illustrationPath: "/display/minigames/trivia-illustration.svg",
  illustrationAlt: "Trivia mini-game artwork",
  summary: "Quick-fire questions start once your team is in position.",
  steps: [
    "A question appears on screen.",
    "Your team gives one answer per question.",
    "You'll get 3 questions this turn."
  ]
};

test("renders team-first intro surface with roster and briefing details", () => {
  const html = renderToStaticMarkup(
    <MinigameIntroStageBody
      phaseLabel="Team Round Intro"
      briefingContent={briefingContentFixture}
      sauceName="Classic Buffalo"
      activeTeamName="Team Heat"
      activeTeamPlayerNames={["Alex", "Morgan", "Chris"]}
    />
  );

  assert.match(html, /Team Round Intro/);
  assert.match(html, /Now Arriving/);
  assert.match(html, /Team Heat/);
  assert.match(html, /You&#x27;re up now\./);
  assert.match(html, /Head to the board and get set\./);
  assert.match(html, /Team Roster/);
  assert.match(html, /Alex/);
  assert.match(html, /Morgan/);
  assert.match(html, /Mini-Game/);
  assert.match(html, /Trivia/);
  assert.match(html, /Sauce/);
  assert.match(html, /Classic Buffalo/);
  assert.match(html, /How This Turn Works/);
  assert.match(html, /A question appears on screen\./);
  assert.match(html, /Your team gives one answer per question\./);
  assert.match(html, /display\/minigames\/trivia-illustration\.svg/);
});

test("renders fallback team and briefing content when intro data is unavailable", () => {
  const html = renderToStaticMarkup(
    <MinigameIntroStageBody
      phaseLabel="Team Round Intro"
      briefingContent={null}
      sauceName={null}
      activeTeamName={null}
      activeTeamPlayerNames={[]}
    />
  );

  assert.match(html, /Next Team/);
  assert.match(html, /You&#x27;re up now\./);
  assert.match(html, /Pending Selection/);
  assert.match(html, /No players assigned yet\./);
  assert.match(html, /The host will explain this round once the next team is in position\./);
});
