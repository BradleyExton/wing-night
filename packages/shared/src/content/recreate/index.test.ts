import assert from "node:assert/strict";
import test from "node:test";

import {
  isRecreateContentFile,
  validateRecreateContentFile,
  validateRecreatePrompt
} from "./index.js";

const validPrompt = {
  id: "cottage-underwater",
  title: "Cottage weekend",
  targetImageSrc: "recreate/targets/cottage-underwater.png",
  sourceImageSrc: "geo/cottage.jpg",
  prompt: "Everyone is scuba diving on the sea floor, with a neon sign",
  ingredients: ["Underwater", "Scuba gear", "Neon sign"]
};

test("accepts a prompt with a source photo and one without", () => {
  assert.deepEqual(validateRecreatePrompt(validPrompt), []);

  const { sourceImageSrc: _sourceImageSrc, ...sampleOnlyPrompt } = validPrompt;
  assert.deepEqual(validateRecreatePrompt(sampleOnlyPrompt), []);
});

test("names the field when a required string is missing", () => {
  const issues = validateRecreatePrompt({ ...validPrompt, targetImageSrc: " " });
  assert.deepEqual(issues, [
    { path: "targetImageSrc", message: "must be a non-empty string" }
  ]);
});

test("rejects an ingredient list outside two to six entries", () => {
  assert.equal(
    validateRecreatePrompt({ ...validPrompt, ingredients: ["Only one"] })[0]?.path,
    "ingredients"
  );
  assert.equal(
    validateRecreatePrompt({
      ...validPrompt,
      ingredients: ["a", "b", "c", "d", "e", "f", "g"]
    })[0]?.path,
    "ingredients"
  );
});

test("names the blank ingredient by index", () => {
  assert.deepEqual(validateRecreatePrompt({ ...validPrompt, ingredients: ["Fine", ""] }), [
    { path: "ingredients[1]", message: "must be a non-empty string" }
  ]);
});

test("rejects a present but blank sourceImageSrc", () => {
  assert.equal(
    validateRecreatePrompt({ ...validPrompt, sourceImageSrc: "" })[0]?.path,
    "sourceImageSrc"
  );
});

test("validates the file as a prompt pack with unique ids", () => {
  assert.equal(isRecreateContentFile({ prompts: [validPrompt] }), true);
  assert.equal(isRecreateContentFile({ prompts: [] }), false);

  const duplicateIssues = validateRecreateContentFile({
    prompts: [validPrompt, validPrompt]
  });
  assert.equal(duplicateIssues.length, 1);
  assert.equal(duplicateIssues[0]?.path, "prompts[1].id");
});
