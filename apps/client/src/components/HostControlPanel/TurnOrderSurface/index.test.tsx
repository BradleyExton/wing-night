import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { Team } from "@wingnight/shared";

import { TurnOrderSurface } from "./index";

const teamsFixture: Team[] = [
  {
    id: "team-alpha",
    name: "Team Alpha",
    playerIds: ["player-1"],
    totalScore: 10
  },
  {
    id: "team-beta",
    name: "Team Beta",
    playerIds: ["player-2"],
    totalScore: 8
  }
];

test("renders editable turn order controls during round intro", () => {
  const html = renderToStaticMarkup(
    <TurnOrderSurface
      orderedTeams={teamsFixture}
      isEditable={true}
      onReorderTurnOrder={() => undefined}
    />
  );

  assert.match(
    html,
    /Adjust team order before the round begins\. This order carries into later rounds until changed\./
  );
  assert.doesNotMatch(html, /Locked until the round ends/);
  assert.match(html, /Move Up/);
  assert.match(html, /Move Down/);
});

test("renders locked message and disables controls once a round is under way", () => {
  const html = renderToStaticMarkup(
    <TurnOrderSurface
      orderedTeams={teamsFixture}
      isEditable={false}
      onReorderTurnOrder={() => undefined}
    />
  );

  assert.match(
    html,
    /Turn order is locked once a round is under way\. Edit before the game starts or between rounds\./
  );
  assert.match(html, /Locked until the round ends/);
  assert.match(html, /disabled=""/);
});

