import assert from "node:assert/strict";
import test from "node:test";

import { warnDroppedOutfitChoices } from "./index.js";

test("does say nothing when every outfit is wearable", () => {
  const messages: string[] = [];

  warnDroppedOutfitChoices({
    players: [
      { id: "player-1", name: "Rob", outfits: { metal: { top: { item: "battle-vest-a" } } } },
      { id: "player-2", name: "Ada" }
    ],
    warn: (message) => messages.push(message)
  });

  assert.deepEqual(messages, []);
});

test("does name the player, genre and slot of each choice it will not draw", () => {
  const messages: string[] = [];

  warnDroppedOutfitChoices({
    players: [
      {
        id: "player-1",
        name: "Rob",
        outfits: { metal: { top: { item: "cut-vest" } }, country: { boots: { item: "combat-boots-a" } } }
      }
    ],
    warn: (message) => messages.push(message)
  });

  assert.equal(messages.length, 2);
  assert.match(messages[0] ?? "", /"Rob" outfits\.metal\.top\.item "cut-vest" is not in the catalogue/);
  assert.match(messages[1] ?? "", /"Rob" outfits\.country\.boots is not a slot a country bird has/);
});
