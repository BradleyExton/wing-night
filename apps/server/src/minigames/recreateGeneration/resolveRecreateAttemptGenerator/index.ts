import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { resolveContentLayerDirs } from "../../../contentLoader/contentLoaderUtils/index.js";
import {
  extensionForMimeType,
  readImageFromDirs,
  type GeneratedImage,
  type ImageEditor
} from "../../../imageGeneration/geminiImageEditor/index.js";
import type { RecreateAttemptGenerator } from "../index.js";
import {
  composeRecreateEditPrompt,
  RECREATE_ATTEMPTS_PACK_PATH
} from "../recreateEditPrompt/index.js";

// A pack-relative source is read from the first content layer's `assets/`
// that has it — the same order the asset route serves them in.
export const readSourceImage = (
  contentRootDir: string,
  sourceImageSrc: string | null
): GeneratedImage | null => {
  return readImageFromDirs(
    resolveContentLayerDirs(contentRootDir).map((layerDir) => resolve(layerDir, "assets")),
    sourceImageSrc
  );
};

// Attempt ids carry ":" (prompt:team:sequence); the file name cannot.
export const toAttemptFileStem = (attemptId: string): string => {
  return attemptId.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();
};

type ResolveRecreateAttemptGeneratorInput = {
  contentRootDir: string;
  imageEditor: ImageEditor;
};

export const resolveRecreateAttemptGenerator = ({
  contentRootDir,
  imageEditor
}: ResolveRecreateAttemptGeneratorInput): RecreateAttemptGenerator => {
  const attemptsDir = join(contentRootDir, "local", "assets", RECREATE_ATTEMPTS_PACK_PATH);

  return async ({ attemptId, prompt, sourceImageSrc }) => {
    const sourceImage = readSourceImage(contentRootDir, sourceImageSrc);
    const image = await imageEditor.generate({
      prompt: sourceImage === null ? prompt : composeRecreateEditPrompt(prompt),
      sourceImage,
      aspectRatio: "16:9"
    });
    const fileName = `${toAttemptFileStem(attemptId)}.${extensionForMimeType(image.mimeType)}`;

    mkdirSync(attemptsDir, { recursive: true });
    writeFileSync(join(attemptsDir, fileName), Buffer.from(image.base64, "base64"));

    return `${RECREATE_ATTEMPTS_PACK_PATH}/${fileName}`;
  };
};

export { composeRecreateEditPrompt, RECREATE_ATTEMPTS_PACK_PATH };
