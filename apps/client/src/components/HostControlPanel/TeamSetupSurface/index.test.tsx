import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { TeamSetupSurface } from "./index";

test("renders preset teams while keeping setup controls available", () => {
  const html = renderToStaticMarkup(
    <TeamSetupSurface
      nextTeamName=""
      setupMutationsDisabled={false}
      autoAssignDisabled={false}
      players={[
        { id: "player-1", name: "Alex" },
        { id: "player-2", name: "Morgan" }
      ]}
      teams={[
        {
          id: "team-1",
          name: "Preset Team Alpha",
          playerIds: ["player-1"],
          totalScore: 0
        },
        {
          id: "team-2",
          name: "Preset Team Beta",
          playerIds: [],
          totalScore: 0
        }
      ]}
      onNextTeamNameChange={(): void => {
        return;
      }}
      onCreateTeamSubmit={(): void => {
        return;
      }}
      onAutoAssignRemainingPlayers={(): void => {
        return;
      }}
    />
  );

  assert.match(html, /Team Setup/);
  assert.match(html, /Preset teams load here, and you can still add teams/);
  assert.match(html, /Create Team/);
  assert.match(html, /Auto-Assign Remaining Players/);
  assert.match(html, /Preset Team Alpha/);
  assert.match(html, /Preset Team Beta/);
});
