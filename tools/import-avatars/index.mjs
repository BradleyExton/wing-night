#!/usr/bin/env node
// Generates flat-vector caricature heads for the roster with the Gemini image API:
//   pnpm import:avatars [--dry-run] [--force] [--only steve-b,jazz] [--style-ref path.png] [--model name]
// Everything it reads and writes lives in the CONTENT PACK — the one directory
// outside the repo that every worktree shares (see contentLoaderUtils). It
// reads <pack>/local/players.json (seeded from the repo's sample roster if
// missing), looks for one photo per player in <pack>/local/avatar-sources/
// named after the player's slug (Steve B -> steve-b.jpg), sends each photo once
// with the prompt assembled from design/illustration-spec.md, and writes the
// head to <pack>/local/assets/avatars/<slug>.png — which the server serves at
// CONTENT_ASSET_ROUTE_PATH. Then it points the player's avatarSrc at it
// (pack-relative, `avatars/<slug>.png`) and writes a contact sheet next to the
// sources.
// The head comes back on a magenta background (Gemini cannot return alpha);
// that is flood-filled out and the result cropped to the head before it is
// written, so the bird wears the head's own silhouette.
// Offline-time tool only: the app never talks to Gemini. Needs GEMINI_API_KEY,
// which lives in the pack's own .env beside the content it generates — one key
// file, not one per worktree.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import {
  applyAvatarSrc,
  assemblePrompt,
  buildContactSheet,
  buildGeminiRequest,
  buildGeminiUrl,
  DEFAULT_MODEL,
  extractGeneratedImage,
  knockOutBackground,
  opaqueBounds,
  pickStyleReference,
  planImports
} from "./lib.mjs";
import { withRaster } from "./raster.mjs";
import {
  DEFAULT_CONTENT_ROOT_DIR,
  resolveContentRootDir
} from "../../apps/server/src/contentLoader/contentLoaderUtils/index.ts";

// The same resolver the server boots with, imported rather than re-derived: a
// tool that wrote where the server does not read is the exact failure this
// consolidation exists to end.
const contentRootDir = resolveContentRootDir();
const sourcesDir = join(contentRootDir, "local/avatar-sources");
const avatarsDir = join(contentRootDir, "local/assets/avatars");
const localPlayersPath = join(contentRootDir, "local/players.json");
const samplePlayersPath = join(DEFAULT_CONTENT_ROOT_DIR, "sample/players.json");
const packEnvPath = join(contentRootDir, ".env");
const manifestPath = join(sourcesDir, "manifest.json");
const contactSheetPath = join(sourcesDir, "contact-sheet.html");

const parseArgs = (argv) => {
  const args = { dryRun: false, force: false, only: null, styleRef: null, model: DEFAULT_MODEL };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--force") args.force = true;
    else if (arg === "--only") args.only = argv[++index].split(",").map((slug) => slug.trim());
    else if (arg === "--style-ref") args.styleRef = resolve(argv[++index]);
    else if (arg === "--model") args.model = argv[++index];
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
};

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const writeJson = (path, value) => writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
const readImage = (path) => ({ fileName: path, base64: readFileSync(path).toString("base64") });

const generateHead = async ({ apiKey, model, prompt, photoPath, styleRefPath }) => {
  const body = buildGeminiRequest({
    prompt,
    photo: readImage(photoPath),
    styleReference: styleRefPath === null ? null : readImage(styleRefPath)
  });
  const response = await fetch(buildGeminiUrl(model), {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    throw new Error(`Gemini ${response.status}: ${(await response.text()).slice(0, 400)}`);
  }
  return extractGeneratedImage(await response.json());
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  console.log(`Content pack: ${contentRootDir}`);
  mkdirSync(sourcesDir, { recursive: true });
  mkdirSync(avatarsDir, { recursive: true });

  if (!existsSync(localPlayersPath)) {
    mkdirSync(join(contentRootDir, "local"), { recursive: true });
    writeFileSync(localPlayersPath, readFileSync(samplePlayersPath));
    console.log(`Seeded ${localPlayersPath} from the sample roster.`);
  }

  const playersFile = readJson(localPlayersPath);
  const manifest = existsSync(manifestPath) ? readJson(manifestPath) : { generated: {} };
  const sourceFiles = readdirSync(sourcesDir);
  const plan = planImports({
    players: playersFile.players,
    sourceFiles,
    generated: manifest.generated,
    force: args.force,
    only: args.only
  });

  const styleRefPath =
    args.styleRef ??
    (() => {
      const file = pickStyleReference({ plan, generated: manifest.generated });
      return file === null ? null : join(avatarsDir, file);
    })();

  console.log(`Model: ${args.model}`);
  console.log(`Style reference: ${styleRefPath === null ? "none (first head sets the style)" : styleRefPath}`);
  for (const row of plan) {
    console.log(`  ${row.skipReason === null ? "GEN " : "skip"} ${row.name.padEnd(12)} ${row.skipReason ?? `${row.sourceFile} -> ${row.outputFile}`}`);
  }

  const todo = plan.filter((row) => row.skipReason === null);
  if (args.dryRun || todo.length === 0) {
    console.log(args.dryRun ? "Dry run, nothing sent." : "Nothing to generate.");
    writeFileSync(contactSheetPath, renderSheet(plan, manifest));
    return;
  }

  // Loaded from the pack, not the repo: the key belongs with the content it
  // generates, so a fresh worktree needs no .env of its own. An exported
  // GEMINI_API_KEY in the shell still wins.
  if (!process.env.GEMINI_API_KEY && existsSync(packEnvPath)) {
    process.loadEnvFile(packEnvPath);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(`GEMINI_API_KEY is not set. Put it in ${packEnvPath}.`);
  }

  let currentStyleRef = styleRefPath;
  await withRaster(async (raster) => {
    for (const row of todo) {
      process.stdout.write(`Generating ${row.name}… `);
      try {
        const prompt = assemblePrompt({ hasStyleReference: currentStyleRef !== null });
        const image = await generateHead({
          apiKey,
          model: args.model,
          prompt,
          photoPath: join(sourcesDir, row.sourceFile),
          styleRefPath: currentStyleRef
        });
        const outputPath = join(avatarsDir, row.outputFile);
        writeFileSync(outputPath, await finishHead(raster, image));
        manifest.generated[row.slug] = { file: row.outputFile, model: args.model, at: new Date().toISOString() };
        writeJson(manifestPath, manifest);
        if (currentStyleRef === null) currentStyleRef = outputPath;
        console.log(`ok (${image.mimeType}, keyed and cropped)`);
      } catch (error) {
        console.log(`FAILED: ${error.message}`);
      }
    }
  });

  writeJson(localPlayersPath, applyAvatarSrc(playersFile, Object.keys(manifest.generated)));
  writeFileSync(contactSheetPath, renderSheet(plan, manifest));
  console.log(`Contact sheet: ${contactSheetPath}`);
  console.log("Restart the server to load the updated roster.");
};

// Key the background out, crop to what is left, and hand back a PNG buffer.
const finishHead = async (raster, image) => {
  const decoded = await raster.decode(image);
  knockOutBackground(decoded);
  const crop = opaqueBounds(decoded);
  if (crop === null) {
    throw new Error("nothing left after keying the background out");
  }
  return raster.encodePng({ ...decoded, crop });
};

const renderSheet = (plan, manifest) =>
  buildContactSheet({
    plan,
    generated: manifest.generated,
    sourcesDirRelative: ".",
    avatarsDirRelative: relative(sourcesDir, avatarsDir)
  });

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
