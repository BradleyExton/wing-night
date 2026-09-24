import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { MinigameTimerChip, resolveMinigameTimerChipState } from "./index";
import * as styles from "./styles";

const render = (remainingSeconds: number | null): string =>
  renderToStaticMarkup(<MinigameTimerChip remainingSeconds={remainingSeconds} />);

// The three states, as the e2e suite reads them: the state is on the element,
// the copy inside is the copy module's. Which second is which is
// `utils/timerUrgency`'s and tested there; this only holds that the chip
// crosses on the same second the predicates do.
test("does read the clock in the calm pill for most of the turn", () => {
  const html = render(45);

  assert.match(html, /data-minigame-timer-chip="calm"/);
  assert.ok(html.includes(`class="${styles.timerChip}"`));
  assert.match(html, />00:45</);
});

test("does grow to the bare seconds in the heat tube under ten seconds", () => {
  const html = render(9);

  assert.match(html, /data-minigame-timer-chip="urgent"/);
  assert.ok(html.includes(`class="${styles.timerChipUrgent}"`));
  // "9", never "00:09": a room counts a clock down in bare seconds, and at
  // this size the leading zeros would be the biggest nothing on the TV.
  assert.match(html, />9</);
  assert.doesNotMatch(html, /00:09/);
});

test("does call time in the same grown tube at zero", () => {
  const html = render(0);

  assert.match(html, /data-minigame-timer-chip="time_up"/);
  assert.ok(html.includes(`class="${styles.timerChipTimeUp}"`));
  assert.match(html, />Time!</);
});

// docs/takeover-layout-api.md §6: a host-paced game gets nothing, not an empty
// pill — the slot costs no width.
test("does render nothing when the room has no clock", () => {
  assert.equal(render(null), "");
});

test("does cross from calm to urgent on the tenth second and to time up on zero", () => {
  assert.equal(resolveMinigameTimerChipState(11), "calm");
  assert.equal(resolveMinigameTimerChipState(10), "urgent");
  assert.equal(resolveMinigameTimerChipState(1), "urgent");
  assert.equal(resolveMinigameTimerChipState(0), "time_up");
});
