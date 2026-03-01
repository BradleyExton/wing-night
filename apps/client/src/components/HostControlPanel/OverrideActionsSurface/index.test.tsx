import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import {
  OverrideActionsSurface,
  reducePendingConfirmation
} from "./index";

test("renders escape-hatch actions based on availability", () => {
  const html = renderToStaticMarkup(
    <OverrideActionsSurface
      showSkipTurnBoundaryAction={true}
      showRedoLastMutationAction={false}
      showResetGameAction={true}
      onSkipTurnBoundary={() => undefined}
      onResetGame={() => undefined}
    />
  );

  assert.match(html, /Escape Hatches/);
  assert.match(html, /Skip Turn/);
  assert.doesNotMatch(html, /Undo Last Score/);
  assert.match(html, /Reset Game/);
});

test("renders confirmation dialog when pending action exists", () => {
  const html = renderToStaticMarkup(
    <OverrideActionsSurface
      showSkipTurnBoundaryAction={true}
      showRedoLastMutationAction={true}
      showResetGameAction={true}
      onSkipTurnBoundary={() => undefined}
      onRedoLastMutation={() => undefined}
      onResetGame={() => undefined}
      initialPendingAction="reset_game"
    />
  );

  assert.match(html, /Confirm Reset Game/);
  assert.match(html, /Reset returns the game to setup and clears teams and scores\./);
  assert.match(html, /Confirm/);
  assert.match(html, /Cancel/);
});

test("confirmation reducer clears pending action on cancel", () => {
  const nextState = reducePendingConfirmation("skip_turn_boundary", { type: "clear" });

  assert.equal(nextState, null);
});

