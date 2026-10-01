import assert from "node:assert/strict";
import test from "node:test";

import { resolveHenFigure } from "./index.js";

const FIGURE = {
  playerId: "p1",
  name: "Alex",
  avatarSrc: "avatars/alex.png",
  teamId: "team-a",
  genre: "Metal"
};

test("does dress the player's own hen in their team's colour and shape when the block has a player", () => {
  const hen = resolveHenFigure({ figure: FIGURE, activeTurnTeamId: "team-b", serverOrigin: "http://server.test" });

  assert.equal(hen.playerName, "Alex");
  assert.ok(hen.fillClassName.startsWith("text-team"));
  assert.notEqual(hen.silhouette, undefined);
});

test("does give the house hen the turn's colour when the block has nobody on it", () => {
  const hen = resolveHenFigure({ figure: null, activeTurnTeamId: "team-a", serverOrigin: null });

  assert.equal(hen.playerName, null);
  assert.equal(hen.silhouette, undefined);
  assert.ok(hen.fillClassName.startsWith("text-"));
});
