import assert from "node:assert/strict";
import test from "node:test";

import { resolveHenFigure } from "./index.js";

test("does dress the hen as the player when the climb has one", () => {
  const hen = resolveHenFigure(
    { playerId: "p-1", name: "Alex", avatarSrc: "avatars/alex.png", teamId: "team-alpha", genre: "Country" },
    null,
    "http://10.0.0.2:3000"
  );

  assert.equal(hen.playerName, "Alex");
  assert.match(JSON.stringify(hen.appearance), /http:\/\/10\.0\.0\.2:3000/);
});

test("does draw the house hen in the team colour when nobody is seated", () => {
  const hen = resolveHenFigure(null, "team-alpha", null);

  assert.equal(hen.playerName, null);
  assert.ok(hen.fillClassName.length > 0);
});
