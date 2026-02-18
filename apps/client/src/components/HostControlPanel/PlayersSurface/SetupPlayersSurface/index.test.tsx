import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { SetupPlayersSurface } from "./index";

test("renders assignment controls during setup", () => {
  const html = renderToStaticMarkup(
    <SetupPlayersSurface
      mode="setup"
      players={[
        { id: "player-1", name: "Alex" },
        { id: "player-2", name: "Morgan" }
      ]}
      teams={[
        {
          id: "team-alpha",
          name: "Team Alpha",
          playerIds: ["player-1"],
          totalScore: 10
        }
      ]}
      assignedTeamByPlayerId={new Map()}
      assignmentDisabled={false}
      onAssignPlayer={(): void => {
        return;
      }}
    />
  );

  assert.match(html, /Assign Alex to a team/);
  assert.match(html, /Unassigned/);
  assert.match(html, /Team Alpha/);
});
