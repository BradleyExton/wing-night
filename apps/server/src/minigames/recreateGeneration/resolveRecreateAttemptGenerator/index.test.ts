import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import type { ImageEditRequest } from "../../../imageGeneration/geminiImageEditor/index.js";
import {
  composeRecreateEditPrompt,
  readSourceImage,
  resolveRecreateAttemptGenerator,
  toAttemptFileStem
} from "./index.js";

const createPack = (): string => {
  const contentRootDir = mkdtempSync(join(tmpdir(), "wn-recreate-"));
  mkdirSync(join(contentRootDir, "local", "assets", "geo"), { recursive: true });
  writeFileSync(join(contentRootDir, "local", "assets", "geo", "cottage.jpg"), "jpegbytes");
  return contentRootDir;
};

test("reads a pack-relative source photo and leaves sample and remote sources alone", () => {
  const contentRootDir = createPack();

  assert.deepEqual(readSourceImage(contentRootDir, "geo/cottage.jpg"), {
    mimeType: "image/jpeg",
    base64: Buffer.from("jpegbytes").toString("base64")
  });
  assert.equal(readSourceImage(contentRootDir, "/sample-assets/recreate/x.svg"), null);
  assert.equal(readSourceImage(contentRootDir, "https://example.com/x.jpg"), null);
  assert.equal(readSourceImage(contentRootDir, "geo/missing.jpg"), null);
  assert.equal(readSourceImage(contentRootDir, null), null);
});

test("turns an attempt id into a safe file stem", () => {
  assert.equal(toAttemptFileStem("Cottage Space:team-1:2"), "cottage-space-team-1-2");
});

test("edits the source photo with the team's prompt and writes the forgery into the pack", async () => {
  const contentRootDir = createPack();
  const requests: ImageEditRequest[] = [];
  const generateAttempt = resolveRecreateAttemptGenerator({
    contentRootDir,
    imageEditor: {
      model: "fake",
      generate: async (request) => {
        requests.push(request);
        return { mimeType: "image/png", base64: Buffer.from("pngbytes").toString("base64") };
      }
    }
  });

  const imageSrc = await generateAttempt({
    attemptId: "cottage:team-1:1",
    prompt: "everyone underwater",
    sourceImageSrc: "geo/cottage.jpg"
  });

  assert.equal(imageSrc, "recreate/attempts/cottage-team-1-1.png");
  assert.equal(requests[0]?.prompt, composeRecreateEditPrompt("everyone underwater"));
  assert.equal(requests[0]?.sourceImage?.mimeType, "image/jpeg");

  const writtenPath = join(contentRootDir, "local", "assets", "recreate", "attempts", "cottage-team-1-1.png");
  assert.equal(existsSync(writtenPath), true);
  assert.equal(readFileSync(writtenPath, "utf8"), "pngbytes");
});

test("paints from the prompt alone when the target has no pack photo behind it", async () => {
  const contentRootDir = createPack();
  const requests: ImageEditRequest[] = [];
  const generateAttempt = resolveRecreateAttemptGenerator({
    contentRootDir,
    imageEditor: {
      model: "fake",
      generate: async (request) => {
        requests.push(request);
        return { mimeType: "image/jpeg", base64: "" };
      }
    }
  });

  const imageSrc = await generateAttempt({
    attemptId: "beach:team-2:1",
    prompt: "a dinosaur",
    sourceImageSrc: null
  });

  assert.equal(imageSrc, "recreate/attempts/beach-team-2-1.jpg");
  assert.equal(requests[0]?.prompt, "a dinosaur");
  assert.equal(requests[0]?.sourceImage, null);
  assert.equal(requests[0]?.aspectRatio, "16:9");
});
