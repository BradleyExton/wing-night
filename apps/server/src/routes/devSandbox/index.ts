import { Router } from "express";
import type { MinigameDevManifest } from "@wingnight/minigames-core";
import {
  resolveMinigameDefinition,
  resolveMinigameTypeFromSlug,
  type GameConfigFile,
  type MinigameType
} from "@wingnight/shared";

import { loadContent } from "../../contentLoader/index.js";

type CreateDevSandboxRouterOptions = {
  contentRootDir?: string;
};

// What the night would actually put on the board for this game. Mirrors
// `resolveMinigamePointsMax`: the final round of the night scores out of
// `finalRoundMax`, every other round out of `defaultMax`. A game the config
// never schedules has no round to read, so it takes the default.
const resolvePointsMax = (
  gameConfig: GameConfigFile,
  minigameType: MinigameType
): number => {
  const roundIndex = gameConfig.rounds.findIndex(
    (round) => round.minigame === minigameType
  );

  if (roundIndex === gameConfig.rounds.length - 1 && roundIndex !== -1) {
    return gameConfig.minigameScoring.finalRoundMax;
  }

  return gameConfig.minigameScoring.defaultMax;
};

// Mirrors `resolveMinigameRules`, which reads the same key off the same config.
const resolveRules = (
  gameConfig: GameConfigFile,
  minigameType: MinigameType
): MinigameDevManifest["rules"] => {
  const { rulesKey } = resolveMinigameDefinition(minigameType);

  if (rulesKey === null) {
    return null;
  }

  return gameConfig.minigameRules?.[rulesKey] ?? null;
};

// The sandbox's fixture, rebuilt from the real content pack: the party's own
// roster (heads and all), its teams in their genres, and the prompt bank this
// game would draw from on the night. Every field is the one the server hands
// `initialize()` at the top of a turn (see `initializeActiveMinigameRuntimeState`),
// so a surface that looks right here looks right in the room.
const buildDevManifest = (
  minigameType: MinigameType,
  contentRootDir?: string
): MinigameDevManifest => {
  const { players, teams, gameConfig, minigameContentById } = loadContent(
    contentRootDir === undefined ? {} : { contentRootDir }
  );
  const teamIds = teams.map((team) => team.id);

  return {
    teamIds,
    players,
    teams,
    teamNameByTeamId: Object.fromEntries(teams.map((team) => [team.id, team.name])),
    activeRoundTeamId: teamIds[0] ?? null,
    pointsMax: resolvePointsMax(gameConfig, minigameType),
    // Nobody has been awarded anything yet — the sandbox opens on a fresh turn.
    pendingPointsByTeamId: Object.fromEntries(teams.map((team) => [team.id, 0])),
    rules: resolveRules(gameConfig, minigameType),
    content: minigameContentById[minigameType] ?? null
  };
};

// Serves the dev sandbox a manifest built from the live content pack, so the
// previews at /dev/minigame/<slug> are drawn with the party's own assets
// instead of the bundled placeholder fixture.
//
// The pack is re-read PER REQUEST rather than once at boot: this is a dev
// surface, the read is a handful of small synchronous JSON files, and it means
// editing a prompt bank or dropping in a new head shows up on a reload without
// restarting the server.
export const createDevSandboxRouter = (
  options: CreateDevSandboxRouterOptions = {}
): Router => {
  const devSandboxRouter = Router();

  devSandboxRouter.get("/:slug", (request, response) => {
    const minigameType = resolveMinigameTypeFromSlug(request.params.slug);

    if (minigameType === null) {
      response.status(404).json({ error: "Unknown minigame slug." });
      return;
    }

    try {
      response.status(200).json(buildDevManifest(minigameType, options.contentRootDir));
    } catch (error) {
      // A pack that fails to load must not blank the sandbox: the client keeps
      // its bundled fixture on any non-200, so the reason is all that is owed
      // here — and a malformed pack is exactly what a dev wants to read.
      const reason = error instanceof Error ? error.message : String(error);
      response.status(500).json({ error: reason });
    }
  });

  return devSandboxRouter;
};
