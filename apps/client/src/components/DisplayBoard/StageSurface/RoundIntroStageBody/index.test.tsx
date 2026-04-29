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

test("renders the three-beat reveal with round, sauce, and minigame", () => {
  const html = renderToStaticMarkup(
    <RoundIntroStageBody currentRoundConfig={roundFixture} />
  );

  assert.match(html, /Coming up/);
  assert.match(html, /02/);
  assert.match(html, /Second Heat/);
  assert.match(html, /Classic Buffalo/);
  assert.match(html, /followed by/);
  assert.match(html, /GEO/);
});

test("zero-pads single-digit round numbers", () => {
  const html = renderToStaticMarkup(
    <RoundIntroStageBody currentRoundConfig={{ ...roundFixture, round: 1 }} />
  );

  assert.match(html, />01</);
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

  assert.match(html, /Inferno Invitational Championship/);
  assert.match(html, /Smoked Honey Habanero Ghost Pepper Reserve/);
  assert.match(html, /GEO/);
});
