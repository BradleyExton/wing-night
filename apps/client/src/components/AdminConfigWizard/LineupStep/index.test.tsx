import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { GameConfigRound } from "@wingnight/shared";

import { buildGameConfig } from "../../../testSupport/roomStateFixtures";
import { LineupStep } from "./index";

const round = (roundNumber: number, minigameMax?: number): GameConfigRound => ({
  round: roundNumber,
  label: `Round ${roundNumber}`,
  sauce: "Mild",
  pointsPerPlayer: 2,
  minigame: "TRIVIA",
  ...(minigameMax === undefined ? {} : { minigameMax })
});

const inputFor = (html: string, id: string): string => {
  return html.match(new RegExp(`<input[^>]*id="${id}"[^>]*>`))?.[0] ?? "";
};

test("does show each round's mini-game max, with the default it falls back to as the placeholder", () => {
  const html = renderToStaticMarkup(
    <LineupStep
      gameConfig={buildGameConfig({ rounds: [round(1, 10), round(2), round(3)] })}
      issueMessagesByPath={new Map()}
      isLocked={false}
      onRoundChange={(): void => {}}
      onAddRound={(): void => {}}
      onRemoveRound={(): void => {}}
    />
  );

  assert.match(html, /Mini-game max points/);
  assert.match(inputFor(html, "admin-round-minigame-max-0"), /value="10"/);
  assert.match(inputFor(html, "admin-round-minigame-max-1"), /value=""/);
  assert.match(inputFor(html, "admin-round-minigame-max-1"), /placeholder="15"/);
  assert.match(inputFor(html, "admin-round-minigame-max-2"), /placeholder="20"/);
});
