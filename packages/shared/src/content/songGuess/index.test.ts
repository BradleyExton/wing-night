import assert from "node:assert/strict";
import test from "node:test";

import {
  isSongGuessContentFile,
  validateSongGuessContentFile,
  validateSongGuessPrompt
} from "./index.js";

const song = (id: string): Record<string, unknown> => ({
  id,
  file: `${id}.mp3`,
  clipStart: 10,
  clipEnd: 25,
  revealStart: 40,
  correctTitle: `Title ${id}`,
  correctArtist: `Artist ${id}`
});

const pathsOf = (issues: { path: string }[]): string[] => {
  return issues.map((issue) => issue.path);
};

test("returns no issues when every song is complete and uniquely keyed", () => {
  const content = { prompts: [song("s1"), song("s2")] };

  assert.deepEqual(validateSongGuessContentFile(content), []);
  assert.equal(isSongGuessContentFile(content), true);
});

test("accepts the optional difficulty and hint fields", () => {
  const content = {
    prompts: [{ ...song("s1"), difficulty: "hard", hint: "A big one" }]
  };

  assert.deepEqual(validateSongGuessContentFile(content), []);
});

test("reports the prompts path when the pack has no songs", () => {
  assert.deepEqual(pathsOf(validateSongGuessContentFile({ prompts: [] })), [
    "prompts"
  ]);
});

test("reports a duplicate song id on its second occurrence", () => {
  const content = { prompts: [song("s1"), song("s1")] };

  assert.deepEqual(pathsOf(validateSongGuessContentFile(content)), [
    "prompts[1].id"
  ]);
});

test("rejects a clip window that does not move forward", () => {
  assert.deepEqual(
    pathsOf(validateSongGuessPrompt({ ...song("s1"), clipStart: 30, clipEnd: 30 })),
    ["clipEnd"]
  );
});

test("rejects negative timestamps", () => {
  assert.deepEqual(
    pathsOf(validateSongGuessPrompt({ ...song("s1"), revealStart: -1 })),
    ["revealStart"]
  );
});

test("reports each missing answer field separately", () => {
  assert.deepEqual(
    pathsOf(
      validateSongGuessPrompt({ ...song("s1"), correctTitle: "", correctArtist: "  " })
    ),
    ["correctTitle", "correctArtist"]
  );
});

// A pack that could reach outside the audio directory is a content bug, not a
// server concern: express.static would refuse it and the host would see a
// silent 404 with no explanation.
test("rejects a file field carrying a path separator", () => {
  assert.deepEqual(
    pathsOf(validateSongGuessPrompt({ ...song("s1"), file: "../../secrets.mp3" })),
    ["file"]
  );
});

test("rejects an unknown difficulty", () => {
  assert.deepEqual(
    pathsOf(validateSongGuessPrompt({ ...song("s1"), difficulty: "impossible" })),
    ["difficulty"]
  );
});

test("reports the entry itself when a song is not an object", () => {
  assert.deepEqual(pathsOf(validateSongGuessContentFile({ prompts: [42] })), [
    "prompts[0]"
  ]);
});
