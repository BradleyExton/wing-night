import assert from "node:assert/strict";
import test from "node:test";

import { isTriviaContentFile, validateTriviaContentFile } from "./index.js";

const prompt = (id: string): Record<string, unknown> => ({
  id,
  question: `Question ${id}`,
  answer: `Answer ${id}`
});

const pathsOf = (issues: { path: string }[]): string[] => {
  return issues.map((issue) => issue.path);
};

test("returns no issues when every prompt is complete and uniquely keyed", () => {
  const content = { prompts: [prompt("q1"), prompt("q2")] };

  assert.deepEqual(validateTriviaContentFile(content), []);
});

test("reports the prompts path when the pack has no prompts", () => {
  assert.deepEqual(pathsOf(validateTriviaContentFile({ prompts: [] })), [
    "prompts"
  ]);
});

test("reports the offending field path when a prompt answer is blank", () => {
  const content = { prompts: [prompt("q1"), { ...prompt("q2"), answer: "" }] };

  assert.deepEqual(pathsOf(validateTriviaContentFile(content)), [
    "prompts[1].answer"
  ]);
});

test("accumulates every missing field on a single prompt", () => {
  const content = { prompts: [{ id: "q1" }] };

  assert.deepEqual(pathsOf(validateTriviaContentFile(content)), [
    "prompts[0].question",
    "prompts[0].answer"
  ]);
});

test("reports the later occurrence when two prompts share an id", () => {
  const content = { prompts: [prompt("q1"), prompt("q2"), prompt("q1")] };
  const issues = validateTriviaContentFile(content);

  assert.deepEqual(pathsOf(issues), ["prompts[2].id"]);
  assert.match(issues[0].message, /must be unique/);
});

test("rejects a duplicate-id pack via the predicate", () => {
  const content = { prompts: [prompt("q1"), prompt("q1")] };

  assert.equal(isTriviaContentFile(content), false);
});

test("does not report a duplicate id for prompts whose id is missing", () => {
  const content = { prompts: [{ question: "a", answer: "b" }, { question: "c", answer: "d" }] };

  assert.deepEqual(pathsOf(validateTriviaContentFile(content)), [
    "prompts[0].id",
    "prompts[1].id"
  ]);
});

test("rejects via the predicate every value the validator reports issues for", () => {
  const rejected: unknown[] = [
    null,
    "nope",
    {},
    { prompts: {} },
    { prompts: [] },
    { prompts: [{ id: "q1", question: "a" }] },
    { prompts: [prompt("q1"), prompt("q1")] }
  ];

  for (const value of rejected) {
    assert.equal(isTriviaContentFile(value), false);
    assert.ok(validateTriviaContentFile(value).length > 0);
  }
});

test("does accept a prompt when its choices include the answer", () => {
  const content = { prompts: [{ ...prompt("q1"), choices: ["Answer q1", "Something else"] }, prompt("q2")] };

  assert.deepEqual(validateTriviaContentFile(content), []);
});

test("does report the choices path when the choices leave the answer out", () => {
  const content = { prompts: [{ ...prompt("q1"), choices: ["Answer one", "Something else"] }] };
  const issues = validateTriviaContentFile(content);

  assert.deepEqual(pathsOf(issues), ["prompts[0].choices"]);
  assert.match(issues[0].message, /must include the answer/);
});

test("does report the choices path when there are fewer than two or more than six choices", () => {
  const tooFew = { prompts: [{ ...prompt("q1"), choices: ["Answer q1"] }] };
  const tooMany = {
    prompts: [{ ...prompt("q1"), choices: ["Answer q1", "b", "c", "d", "e", "f", "g"] }]
  };
  const notAnArray = { prompts: [{ ...prompt("q1"), choices: "Answer q1" }] };

  assert.deepEqual(pathsOf(validateTriviaContentFile(tooFew)), ["prompts[0].choices"]);
  assert.deepEqual(pathsOf(validateTriviaContentFile(tooMany)), ["prompts[0].choices"]);
  assert.deepEqual(pathsOf(validateTriviaContentFile(notAnArray)), ["prompts[0].choices"]);
});

test("does report the choices path naming the choice when a choice is blank or not a string", () => {
  const blank = { prompts: [{ ...prompt("q1"), choices: ["Answer q1", "  "] }] };
  const numeric = { prompts: [{ ...prompt("q1"), choices: ["Answer q1", 7] }] };
  const blankIssues = validateTriviaContentFile(blank);

  assert.deepEqual(pathsOf(blankIssues), ["prompts[0].choices"]);
  assert.match(blankIssues[0].message, /choice 2/);
  assert.deepEqual(pathsOf(validateTriviaContentFile(numeric)), ["prompts[0].choices"]);
});

test("does report a repeat when two choices differ only by case or surrounding spaces", () => {
  const content = { prompts: [{ ...prompt("q1"), choices: ["Answer q1", "Paris", "paris "] }] };
  const issues = validateTriviaContentFile(content);

  assert.deepEqual(pathsOf(issues), ["prompts[0].choices"]);
  assert.match(issues[0].message, /must not repeat/);
});

test("does report the choices path when a choice repeats", () => {
  const content = { prompts: [{ ...prompt("q1"), choices: ["Answer q1", "Twice", "Twice"] }] };
  const issues = validateTriviaContentFile(content);

  assert.deepEqual(pathsOf(issues), ["prompts[0].choices"]);
  assert.match(issues[0].message, /must not repeat/);
});
