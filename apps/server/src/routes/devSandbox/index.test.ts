import assert from "node:assert/strict";
import { once } from "node:events";
import type { Server } from "node:http";
import test from "node:test";
import type { AddressInfo } from "node:net";

import { DEV_SANDBOX_MANIFEST_ROUTE_PATH } from "@wingnight/shared";

import {
  createContentRoot,
  createValidGameConfigJson,
  writeContentFile,
  writeValidContentTree
} from "../../contentLoader/testHarness.js";
import { createApp } from "../../createApp/index.js";

const closeServer = async (server: Server): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
};

const withApp = async (
  contentRootDir: string,
  handle: (baseUrl: string) => Promise<void>
): Promise<void> => {
  const server = createApp({ contentRootDir }).listen(0, "127.0.0.1");

  try {
    await once(server, "listening");

    const { port } = server.address() as AddressInfo;
    await handle(`http://127.0.0.1:${port}${DEV_SANDBOX_MANIFEST_ROUTE_PATH}`);
  } finally {
    await closeServer(server);
  }
};

// The roster the sandbox is supposed to be drawing instead of "Team Alpha":
// real names, real teams, and the pack-relative head each player wears.
const writePartyRoster = (contentRoot: string): void => {
  writeContentFile(
    contentRoot,
    "local/players.json",
    JSON.stringify({
      players: [
        { name: "Rosi", team: "Molten Metal", avatarSrc: "avatars/rosi.png" },
        { name: "Darren M", team: "Spice Girls", avatarSrc: "avatars/darren-m.png" }
      ]
    })
  );
  writeContentFile(
    contentRoot,
    "local/teams.json",
    JSON.stringify({
      teams: [
        { name: "Molten Metal", genre: "metal" },
        { name: "Spice Girls", genre: "pop" }
      ]
    })
  );
};

test("serves a sandbox manifest seeded from the content pack's roster", async () => {
  const contentRoot = createContentRoot();
  writeValidContentTree(contentRoot, "local", "Party");
  writePartyRoster(contentRoot);

  await withApp(contentRoot, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/trivia`);

    assert.equal(response.status, 200);

    const manifest = await response.json();

    assert.deepEqual(
      manifest.players.map((player: { name: string }) => player.name),
      ["Rosi", "Darren M"]
    );
    // The heads are the whole point: a player without `avatarSrc` wears the
    // drawn bird, which is what the bundled fixture already gave us.
    assert.deepEqual(
      manifest.players.map((player: { avatarSrc?: string }) => player.avatarSrc),
      ["avatars/rosi.png", "avatars/darren-m.png"]
    );
    assert.deepEqual(
      manifest.teams.map((team: { name: string }) => team.name),
      ["Molten Metal", "Spice Girls"]
    );
    assert.deepEqual(manifest.teamIds, manifest.teams.map((team: { id: string }) => team.id));
    assert.equal(manifest.activeRoundTeamId, manifest.teamIds[0]);
    assert.deepEqual(
      manifest.pendingPointsByTeamId,
      Object.fromEntries(manifest.teamIds.map((teamId: string) => [teamId, 0]))
    );
  });
});

test("serves the game's own prompt bank and rules from the pack", async () => {
  const contentRoot = createContentRoot();
  writeValidContentTree(contentRoot, "local", "Party");
  writeContentFile(
    contentRoot,
    "local/gameConfig.json",
    createValidGameConfigJson("Party", { questionsPerTurn: 4 })
  );

  await withApp(contentRoot, async (baseUrl) => {
    const manifest = await (await fetch(`${baseUrl}/trivia`)).json();

    assert.deepEqual(manifest.rules, { questionsPerTurn: 4 });
    assert.equal(manifest.content.prompts[0].question, "Party question 1?");
  });
});

// Mirrors `resolveMinigamePointsMax`: the last round of the night is worth
// more, so a sandbox seeded for that game has to score out of the same number
// the room will.
test("scores the night's final game out of the final-round max", async () => {
  const contentRoot = createContentRoot();
  writeValidContentTree(contentRoot, "local", "Party");
  writeContentFile(
    contentRoot,
    "local/gameConfig.json",
    JSON.stringify({
      ...JSON.parse(createValidGameConfigJson("Party")),
      rounds: [
        {
          round: 1,
          label: "Warm Up",
          sauce: "Frank's",
          pointsPerPlayer: 2,
          minigame: "TRIVIA"
        },
        {
          round: 2,
          label: "Finale",
          sauce: "Da Bomb",
          pointsPerPlayer: 3,
          minigame: "GEO"
        }
      ]
    })
  );

  await withApp(contentRoot, async (baseUrl) => {
    const triviaManifest = await (await fetch(`${baseUrl}/trivia`)).json();
    const geoManifest = await (await fetch(`${baseUrl}/geo`)).json();

    assert.equal(triviaManifest.pointsMax, 15);
    assert.equal(geoManifest.pointsMax, 20);
  });
});

test("rejects a slug no minigame answers to", async () => {
  const contentRoot = createContentRoot();
  writeValidContentTree(contentRoot, "local", "Party");

  await withApp(contentRoot, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/not-a-minigame`);

    assert.equal(response.status, 404);
  });
});

// The sandbox is a client page on the Vite origin, and there is no dev proxy
// here, so the manifest is a cross-origin fetch like every media route.
test("allows the cross-origin fetch the sandbox makes", async () => {
  const contentRoot = createContentRoot();
  writeValidContentTree(contentRoot, "local", "Party");

  await withApp(contentRoot, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/trivia`);

    assert.equal(response.headers.get("access-control-allow-origin"), "*");
  });
});
