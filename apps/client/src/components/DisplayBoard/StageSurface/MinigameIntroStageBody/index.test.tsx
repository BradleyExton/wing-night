import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { MinigameIntroStageBody } from "./index";

test("renders the team-first three-beat reveal with roster and minigame", () => {
  const html = renderToStaticMarkup(
    <MinigameIntroStageBody
      activeTeamName="Team Heat"
      activeTeamGenre="metal"
      activeTeamPlayerNames={["Alex", "Morgan", "Chris"]}
      minigameType="TRIVIA"
    />
  );

  assert.match(html, /on the wings/);
  assert.match(html, /metal/);
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
      activeTeamGenre={null}
      activeTeamPlayerNames={[]}
      minigameType={null}
    />
  );

  assert.match(html, /Next Team/);
  assert.match(html, /Pending/);
  assert.doesNotMatch(html, /<p[^>]*roster/i);
});

// The "identical to today when absent" half of the genre line: a team with no
// genre must not render a stray separator next to the eyebrow.
test("renders the eyebrow alone for a team with no genre", () => {
  const html = renderToStaticMarkup(
    <MinigameIntroStageBody
      activeTeamName="Team Heat"
      activeTeamGenre={null}
      activeTeamPlayerNames={[]}
      minigameType="TRIVIA"
    />
  );

  assert.match(html, /on the wings<\/span>/);
});
