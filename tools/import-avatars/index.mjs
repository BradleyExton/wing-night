#!/usr/bin/env node
// Generates flat-vector caricature heads for the roster with the Gemini image API:
//   pnpm import:avatars [--dry-run] [--force] [--only steve-b,jazz] [--style-ref path.png] [--model name]
// Reads content/local/players.json (seeded from content/sample if missing),
// looks for one photo per player in content/local/avatar-sources/ named after
// the player's slug (Steve B -> steve-b.jpg), sends each photo once with the
// prompt assembled from design/illustration-spec.md, and writes the head to
// apps/client/public/local-assets/avatars/<slug>.png. Then it points the
// player's avatarSrc at it and writes a contact sheet next to the sources.
// The head comes back on a magenta background (Gemini cannot return alpha);
// that is flood-filled out and the result cropped to the head before it is
// written, so the bird wears the head's own silhouette.
// Offline-time tool only: the app never talks to Gemini. Needs GEMINI_API_KEY
// (loaded from .env by the pnpm script).
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

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

const repoRootDir = resolve(fileURLToPath(new URL(".", import.meta.url)), "../..");
const sourcesDir = join(repoRootDir, "content/local/avatar-sources");
const avatarsDir = join(repoRootDir, "apps/client/public/local-assets/avatars");
const localPlayersPath = join(repoRootDir, "content/local/players.json");
const samplePlayersPath = join(repoRootDir, "content/sample/players.json");
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
  mkdirSync(sourcesDir, { recursive: true });
  mkdirSync(avatarsDir, { recursive: true });

  if (!existsSync(localPlayersPath)) {
    mkdirSync(join(repoRootDir, "content/local"), { recursive: true });
    writeFileSync(localPlayersPath, readFileSync(samplePlayersPath));
    console.log(`Seeded ${relative(repoRootDir, localPlayersPath)} from the sample roster.`);
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
  console.log(`Style reference: ${styleRefPath === null ? "none (first head sets the style)" : relative(repoRootDir, styleRefPath)}`);
  for (const row of plan) {
    console.log(`  ${row.skipReason === null ? "GEN " : "skip"} ${row.name.padEnd(12)} ${row.skipReason ?? `${row.sourceFile} -> ${row.outputFile}`}`);
  }

  const todo = plan.filter((row) => row.skipReason === null);
  if (args.dryRun || todo.length === 0) {
    console.log(args.dryRun ? "Dry run, nothing sent." : "Nothing to generate.");
    writeFileSync(contactSheetPath, renderSheet(plan, manifest));
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set. Put it in .env at the repo root.");
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
  console.log(`Contact sheet: ${relative(repoRootDir, contactSheetPath)}`);
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
