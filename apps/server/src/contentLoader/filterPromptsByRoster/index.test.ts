import assert from "node:assert/strict";
import test from "node:test";

import type { Player } from "@wingnight/shared";

import { filterPromptsByRoster } from "./index.js";

const players: Player[] = [
  { id: "player-1", name: "Alex" },
  { id: "player-2", name: "Jordan" }
];

const promptsOf = (content: unknown): { id: string }[] => {
  return (content as { prompts: { id: string }[] }).prompts;
};

const idsOf = (content: unknown): string[] => {
  return promptsOf(content).map((prompt) => prompt.id);
};

test("keeps a prompt when a tagged player is on the roster", () => {
  const filtered = filterPromptsByRoster({
    minigameContentById: {
      GEO: { prompts: [{ id: "geo-1", featuredPlayers: ["Jordan"] }] }
    },
    players,
    warn: () => {}
  });

  assert.deepEqual(idsOf(filtered.GEO), ["geo-1"]);
});

test("drops a prompt when no tagged player is on the roster", () => {
  const filtered = filterPromptsByRoster({
    minigameContentById: {
      GEO: {
        prompts: [
          { id: "geo-1", featuredPlayers: ["Jordan"] },
          { id: "geo-2", featuredPlayers: ["Sam"] }
        ]
      }
    },
    players,
    warn: () => {}
  });

  assert.deepEqual(idsOf(filtered.GEO), ["geo-1"]);
});

test("keeps a group prompt when only one of its tagged players is on the roster", () => {
  const filtered = filterPromptsByRoster({
    minigameContentById: {
      GEO: { prompts: [{ id: "geo-1", featuredPlayers: ["Sam", "Alex", "Robin"] }] }
    },
    players,
    warn: () => {}
  });

  assert.deepEqual(idsOf(filtered.GEO), ["geo-1"]);
});

test("keeps every untagged prompt when the roster is anyone", () => {
  const filtered = filterPromptsByRoster({
    minigameContentById: {
      GEO: { prompts: [{ id: "geo-1" }, { id: "geo-2", featuredPlayers: [] }] }
    },
    players,
    warn: () => {}
  });

  assert.deepEqual(idsOf(filtered.GEO), ["geo-1", "geo-2"]);
});

test("filters every prompt bank rather than only the geo one", () => {
  const filtered = filterPromptsByRoster({
    minigameContentById: {
      GEO: { prompts: [{ id: "geo-1", featuredPlayers: ["Sam"] }] },
      TRIVIA: { prompts: [{ id: "trivia-1", featuredPlayers: ["Alex"] }] }
    },
    players,
    warn: () => {}
  });

  assert.deepEqual(idsOf(filtered.GEO), []);
  assert.deepEqual(idsOf(filtered.TRIVIA), ["trivia-1"]);
});

test("preserves sibling keys alongside the filtered prompts", () => {
  const filtered = filterPromptsByRoster({
    minigameContentById: {
      GEO: { label: "Holiday pack", prompts: [{ id: "geo-1" }] }
    },
    players,
    warn: () => {}
  });

  assert.equal((filtered.GEO as { label: string }).label, "Holiday pack");
});

test("passes content through untouched when it carries no prompts array", () => {
  const content = { rounds: [1, 2] };
  const filtered = filterPromptsByRoster({
    minigameContentById: { GEO: content },
    players,
    warn: () => {}
  });

  assert.deepEqual(filtered.GEO, content);
});

test("warns with the hidden count when some prompts are filtered out", () => {
  const warnings: string[] = [];

  filterPromptsByRoster({
    minigameContentById: {
      GEO: {
        prompts: [
          { id: "geo-1", featuredPlayers: ["Alex"] },
          { id: "geo-2", featuredPlayers: ["Alex"] },
          { id: "geo-3", featuredPlayers: ["Robin"] }
        ]
      }
    },
    players,
    warn: (message) => warnings.push(message)
  });

  assert.equal(
    warnings.some((message) => message.includes("1 of 3 prompt(s) hidden")),
    true
  );
});

test("warns that the round has nothing to show when every prompt is filtered out", () => {
  const warnings: string[] = [];

  filterPromptsByRoster({
    minigameContentById: {
      GEO: { prompts: [{ id: "geo-1", featuredPlayers: ["Robin"] }] }
    },
    players,
    warn: (message) => warnings.push(message)
  });

  assert.equal(
    warnings.some((message) => message.includes("nothing to show")),
    true
  );
});

test("warns once per unknown tag name so a typo is visible before the round", () => {
  const warnings: string[] = [];

  filterPromptsByRoster({
    minigameContentById: {
      GEO: {
        prompts: [
          { id: "geo-1", featuredPlayers: ["Jordn", "Alex"] },
          { id: "geo-2", featuredPlayers: ["Jordn"] }
        ]
      }
    },
    players,
    warn: (message) => warnings.push(message)
  });

  const unknownWarnings = warnings.filter((message) =>
    message.includes("not on the roster")
  );

  assert.equal(unknownWarnings.length, 1);
  assert.equal(unknownWarnings[0]?.includes("Jordn"), true);
});

test("matches a tag to the roster ignoring case and padding", () => {
  const filtered = filterPromptsByRoster({
    minigameContentById: {
      GEO: { prompts: [{ id: "geo-1", featuredPlayers: ["  aLeX "] }] }
    },
    players,
    warn: () => {}
  });

  assert.deepEqual(idsOf(filtered.GEO), ["geo-1"]);
});
