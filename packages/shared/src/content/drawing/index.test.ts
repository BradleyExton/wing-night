import assert from "node:assert/strict";
import test from "node:test";

import { isDrawingContentFile, validateDrawingContentFile } from "./index.js";

const prompt = (id: string): Record<string, unknown> => ({
  id,
  prompt: `Draw ${id}`
});

const pathsOf = (issues: { path: string }[]): string[] => {
  return issues.map((issue) => issue.path);
};

test("returns no issues when every prompt is complete and uniquely keyed", () => {
  const content = { prompts: [prompt("d1"), prompt("d2")] };

  assert.deepEqual(validateDrawingContentFile(content), []);
});

test("reports the prompts path when the pack has no prompts", () => {
  assert.deepEqual(pathsOf(validateDrawingContentFile({ prompts: [] })), [
    "prompts"
  ]);
});

test("reports the offending field path when a prompt body is blank", () => {
  const content = { prompts: [{ ...prompt("d1"), prompt: "  " }] };

  assert.deepEqual(pathsOf(validateDrawingContentFile(content)), [
    "prompts[0].prompt"
  ]);
});

test("reports the entry itself when a prompt is not an object", () => {
  assert.deepEqual(pathsOf(validateDrawingContentFile({ prompts: [42] })), [
    "prompts[0]"
  ]);
});

test("reports the later occurrence when two prompts share an id", () => {
  const content = { prompts: [prompt("d1"), prompt("d1")] };
  const issues = validateDrawingContentFile(content);

  assert.deepEqual(pathsOf(issues), ["prompts[1].id"]);
  assert.match(issues[0].message, /must be unique/);
});

test("rejects a duplicate-id pack via the predicate", () => {
  const content = { prompts: [prompt("d1"), prompt("d2"), prompt("d1")] };

  assert.equal(isDrawingContentFile(content), false);
});

test("rejects via the predicate every value the validator reports issues for", () => {
  const rejected: unknown[] = [
    null,
    "nope",
    {},
    { prompts: {} },
    { prompts: [] },
    { prompts: [{ id: "d1" }] },
    { prompts: [prompt("d1"), prompt("d1")] }
  ];

  for (const value of rejected) {
    assert.equal(isDrawingContentFile(value), false);
    assert.ok(validateDrawingContentFile(value).length > 0);
  }
});
