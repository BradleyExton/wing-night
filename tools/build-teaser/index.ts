// Fills apps/client/teaser-public/, the public dir of the online teaser (vite.teaser.config.ts):
//   node tools/build-teaser/index.ts
//
// The teaser is a static site with no party server behind it, so everything the server would
// have served comes along as files: the lobby's fonts, the roster, and the players' heads out of
// the night pack at the same `/content-assets/…` paths the server mounts them on. The heads are
// the pack's, never the repo's, so the folder is gitignored and rebuilt from the pack each time.
//
// The site is unlisted rather than private: anyone with the link can play, and nothing should
// put it in a search index. That is a `noindex` on every response (`_headers`, read by Cloudflare
// Pages) — and a robots.txt that ALLOWS crawling, because a crawler that is turned away never
// reads the noindex and can still list the bare URL off someone else's link.
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import {
  resolveContentLayerDirs,
  resolveContentRootDir
} from "../../apps/server/src/contentLoader/contentLoaderUtils/index.ts";
import { planSfxTakes } from "./planSfxTakes.ts";
import { planTeaserRoster, type PlayerEntry, type TeamEntry } from "./planTeaserRoster.ts";

const REPO_ROOT_DIR = process.cwd();
const CLIENT_DIR = resolve(REPO_ROOT_DIR, "apps/client");
const OUTPUT_DIR = resolve(CLIENT_DIR, "teaser-public");
// The route the party server mounts the pack's assets on (CONTENT_ASSET_ROUTE_PATH).
const CONTENT_ASSET_DIR = "content-assets";
// A head is drawn a couple of hundred pixels tall at most; the pack's are ~500px PNGs.
const HEAD_MAX_PIXELS = 256;
// The games the teaser plays, by their sound folder (each game's `*_SFX_FOLDER`). Their recorded
// takes ship with the site, listed at `/sfx-takes/<game>` the way the server lists them; a game
// with none plays its synthesised cues.
const SFX_GAMES = ["schlonic", "fappy"];

const HEADERS_FILE = `/*
  X-Robots-Tag: noindex, nofollow, noarchive
`;
const ROBOTS_FILE = `User-agent: *
Allow: /
`;

if (!existsSync(resolve(CLIENT_DIR, "vite.teaser.config.ts"))) {
  throw new Error(`Run from the repo root: ${REPO_ROOT_DIR} has no apps/client/vite.teaser.config.ts.`);
}

const layerDirs = resolveContentLayerDirs(resolveContentRootDir());

// The first layer that has the file wins, the loaders' rule.
const readLayered = <T>(fileName: string, key: string): T[] => {
  for (const layerDir of layerDirs) {
    const filePath = join(layerDir, fileName);

    if (existsSync(filePath)) {
      return (JSON.parse(readFileSync(filePath, "utf8")) as Record<string, T[]>)[key] ?? [];
    }
  }

  return [];
};

const findLayeredAsset = (assetSrc: string): string | null => {
  for (const layerDir of layerDirs) {
    const filePath = join(layerDir, "assets", assetSrc);

    if (existsSync(filePath)) {
      return filePath;
    }
  }

  return null;
};

// macOS's own image tool, so the build needs nothing installed; anywhere else the head is
// copied at full size, which only costs bandwidth.
const copyHead = (sourcePath: string, targetPath: string): void => {
  mkdirSync(dirname(targetPath), { recursive: true });

  const resized = spawnSync("sips", ["-Z", String(HEAD_MAX_PIXELS), sourcePath, "--out", targetPath], {
    stdio: "ignore"
  });

  if (resized.status !== 0) {
    cpSync(sourcePath, targetPath);
  }
};

const { roster, avatarSrcs } = planTeaserRoster(
  readLayered<PlayerEntry>("players.json", "players"),
  readLayered<TeamEntry>("teams.json", "teams")
);

rmSync(OUTPUT_DIR, { recursive: true, force: true });
mkdirSync(OUTPUT_DIR, { recursive: true });
cpSync(resolve(CLIENT_DIR, "public/fonts"), resolve(OUTPUT_DIR, "fonts"), { recursive: true });
cpSync(resolve(CLIENT_DIR, "public/favicon.svg"), resolve(OUTPUT_DIR, "favicon.svg"));

const missingHeads: string[] = [];

for (const avatarSrc of avatarSrcs) {
  const sourcePath = findLayeredAsset(avatarSrc);

  if (sourcePath === null) {
    missingHeads.push(avatarSrc);
    continue;
  }

  copyHead(sourcePath, resolve(OUTPUT_DIR, CONTENT_ASSET_DIR, avatarSrc));
}

// The first layer with any takes for a game supplies all of them. The server resolves ownership
// cue by cue, which only differs for a pack that re-records some of the sample's cues and not
// others; the sample pack records none.
for (const game of SFX_GAMES) {
  const sourceDir = layerDirs
    .map((layerDir) => join(layerDir, "assets", "sfx", game))
    .find((dir) => existsSync(dir) && planSfxTakes(game, readdirSync(dir)).fileNames.length > 0);

  if (sourceDir === undefined) {
    continue;
  }

  const { listing, fileNames } = planSfxTakes(game, readdirSync(sourceDir));

  for (const fileName of fileNames) {
    mkdirSync(resolve(OUTPUT_DIR, CONTENT_ASSET_DIR, "sfx", game), { recursive: true });
    cpSync(join(sourceDir, fileName), resolve(OUTPUT_DIR, CONTENT_ASSET_DIR, "sfx", game, fileName));
  }

  mkdirSync(resolve(OUTPUT_DIR, "sfx-takes"), { recursive: true });
  writeFileSync(resolve(OUTPUT_DIR, "sfx-takes", game), JSON.stringify(listing));
}

// The link-preview picture, if `pnpm teaser:card` has captured one; the page only names it when
// it is here (vite.teaser.config.ts).
const shareCardPath = findLayeredAsset("teaser/share-card.png");

if (shareCardPath !== null) {
  cpSync(shareCardPath, resolve(OUTPUT_DIR, "share-card.png"));
}

writeFileSync(resolve(OUTPUT_DIR, "teaser-roster.json"), `${JSON.stringify(roster, null, 2)}\n`);
writeFileSync(resolve(OUTPUT_DIR, "_headers"), HEADERS_FILE);
writeFileSync(resolve(OUTPUT_DIR, "robots.txt"), ROBOTS_FILE);

process.stdout.write(
  `teaser-public: ${roster.players.length} players on ${roster.teams.length} teams, ` +
    `${avatarSrcs.length - missingHeads.length} heads, from ${layerDirs[0]}\n`
);

if (missingHeads.length > 0) {
  console.warn(`teaser-public: no file for ${missingHeads.join(", ")} — those players wear a drawn head.`);
}
