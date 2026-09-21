import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { RunningTotals } from "./index.js";

const teamNameByTeamId = new Map([
  ["team-alpha", "Team Alpha"],
  ["team-beta", "Team Beta"]
]);

const render = (element: JSX.Element): string => renderToStaticMarkup(element);

test("does list every team with points pending, in the order the round carries them", () => {
  const html = render(
    <RunningTotals
      pendingPointsByTeamId={{ "team-alpha": 3, "team-beta": 1 }}
      activeTurnTeamId="team-alpha"
      teamNameByTeamId={teamNameByTeamId}
    />
  );

  assert.match(html, /Team Alpha[\s\S]*3 pts[\s\S]*Team Beta[\s\S]*1 pt</);
});

test("does light only the row of the team whose turn it is", () => {
  const rows =
    render(
      <RunningTotals
        pendingPointsByTeamId={{ "team-alpha": 3, "team-beta": 1 }}
        activeTurnTeamId="team-beta"
        teamNameByTeamId={teamNameByTeamId}
      />
    ).match(/<div class="[^"]*"/g) ?? [];

  assert.equal(rows.filter((row) => row.includes("text-gold")).length, 1);
});

test("does fall back to the team id when the room has no name for it", () => {
  assert.match(
    render(
      <RunningTotals
        pendingPointsByTeamId={{ "team-ghost": 0 }}
        activeTurnTeamId={null}
        teamNameByTeamId={teamNameByTeamId}
      />
    ),
    /team-ghost/
  );
});

test("does print the note under the rows, and nothing at all when there is none", () => {
  // The four host surfaces that carry this card differ only here: FAPPY and
  // SCHLONIC add a par line, JOUST and SONG_GUESS add nothing.
  assert.match(
    render(
      <RunningTotals
        pendingPointsByTeamId={{ "team-alpha": 3 }}
        activeTurnTeamId="team-alpha"
        teamNameByTeamId={teamNameByTeamId}
        note="Full points under 45s"
      />
    ),
    /Full points under 45s/
  );

  const withoutNote = render(
    <RunningTotals
      pendingPointsByTeamId={{ "team-alpha": 3 }}
      activeTurnTeamId="team-alpha"
      teamNameByTeamId={teamNameByTeamId}
    />
  );

  assert.doesNotMatch(withoutNote, /Full points/);
  assert.equal(
    withoutNote.match(/<span/g)?.length,
    3,
    "the title, the team name and its points — no note cell at all"
  );
});
