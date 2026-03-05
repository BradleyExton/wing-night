import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { GameConfigRound } from "@wingnight/shared";

import { RoundIntroStageBody } from "./index";

const roundFixture: GameConfigRound = {
  round: 2,
  label: "Second Heat",
  sauce: "Classic Buffalo",
  pointsPerPlayer: 3,
  minigame: "GEO"
};

test("renders round intro hero headline and metadata", () => {
  const html = renderToStaticMarkup(
    <RoundIntroStageBody currentRoundConfig={roundFixture} />
  );

  assert.match(html, /Round Intro/);
  assert.match(html, /Round 2: Second Heat/);
  assert.match(html, /Sauce is locked\. Mini-game is up next\./);
  assert.match(html, /Sauce/);
  assert.match(html, /Classic Buffalo/);
  assert.match(html, /Mini-Game/);
  assert.match(html, /GEO/);
  assert.match(html, /display\/setup\/flow-round-intro\.png/);
  assert.match(html, /Round intro hero illustration/);
});

test("renders long copy values without dropping metadata", () => {
  const html = renderToStaticMarkup(
    <RoundIntroStageBody
      currentRoundConfig={{
        ...roundFixture,
        round: 9,
        label: "Inferno Invitational Championship",
        sauce: "Smoked Honey Habanero Ghost Pepper Reserve"
      }}
    />
  );

  assert.match(html, /Round 9: Inferno Invitational Championship/);
  assert.match(html, /Smoked Honey Habanero Ghost Pepper Reserve/);
  assert.match(html, /Mini-Game/);
  assert.match(html, /GEO/);
});
