import assert from "node:assert/strict";
import test from "node:test";
import { resolveTeamColorVariant } from "@wingnight/cast";
import type { Player, Team } from "@wingnight/shared";

import { resolveLegBird } from "./index.js";

const players: Player[] = [
  { id: "p-1", name: "Alex", avatarSrc: "avatars/alex.png" },
  { id: "p-2", name: "Morgan" }
];
const teams: Team[] = [
  { id: "team-alpha", name: "Team Alpha", playerIds: ["p-1", "p-2"], totalScore: 0, genre: "country" }
];

test("does dress the named player's bird in their head, the team colour and the team apparel", () => {
  const bird = resolveLegBird({
    leg: { playerId: "p-1" },
    activeTurnTeamId: "team-alpha",
    players,
    teams,
    serverOrigin: "http://127.0.0.1:3000"
  });

  assert.equal(bird.playerName, "Alex");
  assert.equal(bird.appearance.avatarSrc, "http://127.0.0.1:3000/content-assets/avatars/alex.png");
  assert.equal(bird.apparel, "hat");
  assert.equal(bird.fillClassName, resolveTeamColorVariant("team-alpha").characterFillClassName);
});

test("does fly an anonymous hen in the team colour when the leg names nobody", () => {
  const bird = resolveLegBird({
    leg: { playerId: null },
    activeTurnTeamId: "team-alpha",
    players,
    teams,
    serverOrigin: null
  });

  assert.equal(bird.playerName, null);
  assert.equal(bird.appearance.avatarSrc, undefined);
  assert.equal(bird.apparel, "hat");
});

test("does fall back to the muted hen when there is no active team", () => {
  const bird = resolveLegBird({
    leg: { playerId: "p-9" },
    activeTurnTeamId: null,
    players,
    teams,
    serverOrigin: null
  });

  assert.equal(bird.playerName, null);
  assert.equal(bird.apparel, undefined);
  assert.equal(bird.fillClassName, "text-mutedWarm");
});
