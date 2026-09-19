#!/usr/bin/env node
// Paints the RECREATE targets ahead of the night with the Gemini image API:
//   pnpm import:recreate [--dry-run] [--force] [--only cottage-space,diner-noir] [--model name]
// Everything it reads and writes lives in the CONTENT PACK — the one directory
// outside the repo that every worktree shares (see contentLoaderUtils). It
// reads <pack>/local/minigames/recreate.json (seeded from the repo's sample
// bank if missing), and for every prompt whose `targetImageSrc` is blank or
// missing it sends the prompt — with the `sourceImageSrc` party photo attached
// when there is one — and writes the picture to
// <pack>/local/assets/recreate/targets/<id>.<ext>, which the server serves at
// CONTENT_ASSET_ROUTE_PATH. Then it points the prompt's targetImageSrc at it
// (pack-relative, `recreate/targets/<id>.png`).
//
// Audition every target it writes: the checklist is only fair if each
// ingredient is actually visible in the picture. Regenerate one with --force
// --only <id>, or drop an ingredient the model would not paint.
//
// The same request builder the party-time forger uses, so a target and an
// attempt come from one pipeline. Needs GEMINI_API_KEY, which lives in the
// pack's own .env beside the content it generates.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import {
  DEFAULT_CONTENT_ROOT_DIR,
  resolveContentLayerDirs,
  resolveContentRootDir
} from "../../apps/server/src/contentLoader/contentLoaderUtils/index.ts";
import {
  createGeminiImageEditor,
  DEFAULT_GEMINI_IMAGE_MODEL,
  extensionForMimeType,
  readImageFromDirs,
  resolveGeminiApiKey
} from "../../apps/server/src/imageGeneration/geminiImageEditor/index.ts";
import {
  composeRecreateEditPrompt,
  RECREATE_TARGETS_PACK_PATH as TARGETS_PACK_PATH
} from "../../apps/server/src/minigames/recreateGeneration/recreateEditPrompt/index.ts";

export { TARGETS_PACK_PATH };

const contentRootDir = resolveContentRootDir();
const assetLayerDirs = resolveContentLayerDirs(contentRootDir).map((layerDir) => join(layerDir, "assets"));
const targetsDir = join(contentRootDir, "local/assets", TARGETS_PACK_PATH);
const localContentPath = join(contentRootDir, "local/minigames/recreate.json");
const sampleContentPath = join(DEFAULT_CONTENT_ROOT_DIR, "sample/minigames/recreate.json");

const parseArgs = (argv) => {
  const args = { dryRun: false, force: false, only: null, model: DEFAULT_GEMINI_IMAGE_MODEL };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--force") args.force = true;
    else if (arg === "--only") args.only = argv[++index].split(",").map((id) => id.trim());
    else if (arg === "--model") args.model = argv[++index];
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
};

// A target that already points at a generated file is done unless --force;
// a sample placeholder (leading slash) is not a generated file.
export const planTargets = ({ prompts, force = false, only = null }) =>
  prompts.map((prompt) => {
    const hasGenerated =
      typeof prompt.targetImageSrc === "string" &&
      prompt.targetImageSrc.startsWith(`${TARGETS_PACK_PATH}/`);
    const row = { id: prompt.id, skipReason: null };
    if (only !== null && !only.includes(prompt.id)) row.skipReason = "not in --only";
    else if (hasGenerated && !force) row.skipReason = "already generated (use --force)";
    return row;
  });

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const writeJson = (path, value) => writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  console.log(`Content pack: ${contentRootDir}`);
  mkdirSync(targetsDir, { recursive: true });

  if (!existsSync(localContentPath)) {
    mkdirSync(join(contentRootDir, "local/minigames"), { recursive: true });
    writeFileSync(localContentPath, readFileSync(sampleContentPath));
    console.log(`Seeded ${localContentPath} from the sample bank. Edit it, then rerun.`);
  }

  const contentFile = readJson(localContentPath);
  const plan = planTargets({ prompts: contentFile.prompts, force: args.force, only: args.only });

  console.log(`Model: ${args.model}`);
  for (const row of plan) {
    console.log(`  ${row.skipReason === null ? "GEN " : "skip"} ${row.id.padEnd(24)} ${row.skipReason ?? ""}`);
  }

  const todo = plan.filter((row) => row.skipReason === null);
  if (args.dryRun || todo.length === 0) {
    console.log(args.dryRun ? "Dry run, nothing sent." : "Nothing to generate.");
    return;
  }

  const apiKey = resolveGeminiApiKey({ contentRootDir, env: process.env });
  if (apiKey === null) {
    throw new Error(`GEMINI_API_KEY is not set. Put it in ${join(contentRootDir, ".env")}.`);
  }

  const editor = createGeminiImageEditor({ apiKey, model: args.model });

  for (const row of todo) {
    const prompt = contentFile.prompts.find((entry) => entry.id === row.id);
    process.stdout.write(`Generating ${row.id}… `);
    try {
      const sourceImage = readImageFromDirs(assetLayerDirs, prompt.sourceImageSrc ?? null);
      const image = await editor.generate({
        prompt: sourceImage === null ? prompt.prompt : composeRecreateEditPrompt(prompt.prompt),
        sourceImage,
        aspectRatio: "16:9"
      });
      const fileName = `${row.id}.${extensionForMimeType(image.mimeType)}`;
      writeFileSync(join(targetsDir, fileName), Buffer.from(image.base64, "base64"));
      prompt.targetImageSrc = `${TARGETS_PACK_PATH}/${fileName}`;
      writeJson(localContentPath, contentFile);
      console.log(`ok (${image.mimeType}${sourceImage === null ? ", from prompt alone" : ", edited from source"})`);
    } catch (error) {
      console.log(`FAILED: ${error.message}`);
    }
  }

  console.log(`Targets: ${targetsDir}`);
  console.log("Audition each picture against its ingredients, then restart the server.");
};

// Only run when invoked directly, so the planner can be imported by its test.
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
