import assert from "node:assert/strict";
import test from "node:test";

import { isCastPlayerFigure, toCastPlayerFigure } from "./index.js";

const rob = {
  id: "player-1",
  name: "Rob",
  avatarSrc: "avatars/rob.png",
  outfits: {
    metal: { top: { item: "battle-vest-a" }, prop: { item: "flying-v-a" }, sleeve: { item: "cut-long-ago" } },
    pop: { top: { item: "crop-jacket-b" } }
  }
};

test("does dress the figure in the outfit for its team's genre, read tolerantly", () => {
  assert.deepEqual(toCastPlayerFigure(rob, { id: "team-1", genre: "Heavy Metal" }), {
    playerId: "player-1",
    name: "Rob",
    avatarSrc: "avatars/rob.png",
    teamId: "team-1",
    genre: "Heavy Metal",
    outfit: { top: { item: "battle-vest-a", style: "ink" }, prop: { item: "flying-v-a", style: "white" } }
  });
});

test("does leave the figure bare when its team's genre has no outfit or there is no team", () => {
  assert.equal(toCastPlayerFigure(rob, { id: "team-2", genre: "disco" }).outfit, null);
  assert.equal(toCastPlayerFigure(rob, { id: "team-3", genre: undefined }).outfit, null);
  assert.deepEqual(toCastPlayerFigure({ id: "player-2", name: "Ada" }, undefined), {
    playerId: "player-2",
    name: "Ada",
    avatarSrc: null,
    teamId: null,
    genre: null,
    outfit: null
  });
});

test("does read a figure with an outfit or a null one and refuse one without the field", () => {
  const figure = toCastPlayerFigure(rob, { id: "team-1", genre: "metal" });

  assert.equal(isCastPlayerFigure(figure), true);
  assert.equal(isCastPlayerFigure({ ...figure, outfit: null }), true);
  assert.equal(isCastPlayerFigure({ ...figure, outfit: { top: "battle-vest-a" } }), false);

  const { outfit: _outfit, ...withoutOutfit } = figure;

  assert.equal(isCastPlayerFigure(withoutOutfit), false);
});
