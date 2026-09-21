import assert from "node:assert/strict";
import test from "node:test";
import { resolveCharacterFillClassName, UNSEATED_CHARACTER_FILL_CLASS_NAME } from "@wingnight/cast";

import { resolveLegBird } from "./index.js";

test("does dress the figure's bird in their head, the team colour and the team apparel", () => {
  const bird = resolveLegBird({
    figure: { playerId: "p-1", name: "Alex", avatarSrc: "avatars/alex.png", teamId: "team-alpha", genre: "country" },
    activeTurnTeamId: "team-alpha",
    serverOrigin: "http://127.0.0.1:3000"
  });

  assert.equal(bird.playerName, "Alex");
  assert.equal(bird.appearance.avatarSrc, "http://127.0.0.1:3000/content-assets/avatars/alex.png");
  assert.equal(bird.apparel, "hat");
  assert.equal(bird.fillClassName, resolveCharacterFillClassName("team-alpha"));
});

test("does fly an anonymous hen in the team colour when the leg names nobody", () => {
  const bird = resolveLegBird({ figure: null, activeTurnTeamId: "team-alpha", serverOrigin: null });

  assert.equal(bird.playerName, null);
  assert.equal(bird.appearance.avatarSrc, undefined);
  assert.equal(bird.apparel, undefined);
  assert.equal(bird.fillClassName, resolveCharacterFillClassName("team-alpha"));
});

test("does fall back to the unseated hen when there is no team at all", () => {
  const bird = resolveLegBird({ figure: null, activeTurnTeamId: null, serverOrigin: null });

  assert.equal(bird.fillClassName, UNSEATED_CHARACTER_FILL_CLASS_NAME);
});
