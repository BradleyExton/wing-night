import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { MinigameIntroStageBody } from "./index";

test("renders the team-first three-beat reveal with roster and minigame", () => {
  const html = renderToStaticMarkup(
    <MinigameIntroStageBody
      activeTeamName="Team Heat"
      activeTeamPlayerNames={["Alex", "Morgan", "Chris"]}
      minigameType="TRIVIA"
    />
  );

  assert.match(html, /on the wings/);
  assert.match(html, /Team Heat/);
  assert.match(html, /Alex/);
  assert.match(html, /Morgan/);
  assert.match(html, /Chris/);
  assert.match(html, /playing/);
  assert.match(html, /TRIVIA/);
});

test("falls back to placeholder labels when team and minigame data are missing", () => {
  const html = renderToStaticMarkup(
    <MinigameIntroStageBody
      activeTeamName={null}
      activeTeamPlayerNames={[]}
      minigameType={null}
    />
  );

  assert.match(html, /Next Team/);
  assert.match(html, /Pending/);
  assert.doesNotMatch(html, /<p[^>]*roster/i);
});
