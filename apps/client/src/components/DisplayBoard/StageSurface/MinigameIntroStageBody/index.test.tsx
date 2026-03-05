import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { MinigameIntroStageBody } from "./index";

test("renders minigame intro briefing surface with team title and rules", () => {
  const html = renderToStaticMarkup(
    <MinigameIntroStageBody
      minigameType="TRIVIA"
      sauceName="Classic Buffalo"
      activeTeamName="Team Heat"
    />
  );

  assert.match(html, /Team Briefing/);
  assert.match(html, /Team Heat: Get Ready to Eat &amp; Play/);
  assert.match(html, /Mini-Game/);
  assert.match(html, /TRIVIA/);
  assert.match(html, /Hot Sauce/);
  assert.match(html, /Classic Buffalo/);
  assert.match(html, /Rules/);
  assert.match(html, /One question is shown at a time\./);
  assert.match(html, /Host marks each attempt as correct or incorrect\./);
  assert.match(html, /display\/setup\/flow-minigame-intro\.png/);
});

test("renders fallback minigame label when minigame type is unavailable", () => {
  const html = renderToStaticMarkup(
    <MinigameIntroStageBody minigameType={null} sauceName={null} activeTeamName={null} />
  );

  assert.match(html, /Next Team: Get Ready to Eat &amp; Play/);
  assert.match(html, /Pending Selection/);
  assert.match(html, /Host will explain this mini-game before starting\./);
});
