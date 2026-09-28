import { readdirSync } from "node:fs";
import { resolve } from "node:path";

import { Router } from "express";
import {
  CONTENT_ASSET_ROUTE_PATH,
  SFX_ASSET_DIR,
  type SfxTakesListing
} from "@wingnight/shared";

import {
  resolveContentLayerDirs,
  resolveContentRootDir
} from "../../contentLoader/contentLoaderUtils/index.js";

type CreateSfxTakesRouterOptions = {
  contentRootDir?: string;
};

// A game folder is a slug, never a path: anything else is a request to walk
// out of the pack.
const GAME_PATTERN = /^[a-z0-9-]+$/;
// `<cue>.mp3` or `<cue>-<anything>.mp3`. The cue is a camelCase cue-table key,
// so it never holds a dash, and the dash is where the take's own label starts.
const TAKE_FILE_PATTERN = /^([A-Za-z0-9]+)(?:-[^/]*)?\.(?:mp3|wav|ogg|m4a)$/i;

const readTakeFiles = (directory: string): string[] => {
  try {
    return readdirSync(directory);
  } catch {
    // No folder is the default: a game nobody has recorded for is synthesis.
    return [];
  }
};

// Pure over the directory reads: every layer's takes for one game, grouped by
// cue. The layers are read in the loaders' order and a cue is owned by the
// FIRST layer that has any take of it, so a pack that re-records a cue replaces
// the sample's takes rather than shuffling in with them — the same rule the
// asset mount applies to a single file.
export const listSfxTakes = (layerDirs: readonly string[], game: string): SfxTakesListing => {
  const takes: Record<string, string[]> = {};

  for (const layerDir of layerDirs) {
    const layerTakes: Record<string, string[]> = {};

    for (const fileName of readTakeFiles(resolve(layerDir, "assets", SFX_ASSET_DIR, game))) {
      const cue = TAKE_FILE_PATTERN.exec(fileName)?.[1];

      if (cue === undefined) {
        continue;
      }

      (layerTakes[cue] ??= []).push(
        `${CONTENT_ASSET_ROUTE_PATH}/${SFX_ASSET_DIR}/${game}/${encodeURIComponent(fileName)}`
      );
    }

    for (const [cue, paths] of Object.entries(layerTakes)) {
      takes[cue] ??= paths.sort((left, right) => left.localeCompare(right));
    }
  }

  return { takes };
};

// Lists the recorded takes the TV can play for one game. Read per request, not
// at boot, so a take dropped into the pack is heard on the next turn without a
// restart — the files themselves are already served by the content-asset mount.
export const createSfxTakesRouter = (options: CreateSfxTakesRouterOptions = {}): Router => {
  const sfxTakesRouter = Router();

  sfxTakesRouter.get("/:game", (request, response) => {
    const { game } = request.params;

    if (!GAME_PATTERN.test(game)) {
      response.status(404).json({ error: "Unknown game." });
      return;
    }

    const layerDirs = resolveContentLayerDirs(options.contentRootDir ?? resolveContentRootDir());

    response.status(200).json(listSfxTakes(layerDirs, game));
  });

  return sfxTakesRouter;
};
