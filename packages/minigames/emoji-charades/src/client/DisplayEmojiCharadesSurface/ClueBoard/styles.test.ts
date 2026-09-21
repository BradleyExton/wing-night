import assert from "node:assert/strict";
import test from "node:test";

import { MAX_EMOJIS_PER_SUBJECT } from "../../../runtime/types/index.js";
import * as styles from "./styles.js";

test("sizes the clue board from the height the TV leaves, not its width", () => {
  const boardClasses = styles.board.split(" ");

  // `w-full` made the board 1500x1250 on a 1080p TV: the bottom two rows of
  // slots and the status line under them fell off the screen.
  assert.equal(boardClasses.includes("w-full"), false);
  assert.ok(boardClasses.includes("h-full"));
  assert.ok(boardClasses.includes("max-h-full"));
  assert.ok(boardClasses.includes("aspect-[6/5]"));
});

test("keeps a board cell for every emoji the cap allows", () => {
  const columns = Number(/grid-cols-(\d+)/.exec(styles.board)?.[1]);
  const rows = Number(/grid-rows-(\d+)/.exec(styles.board)?.[1]);

  assert.equal(columns * rows, MAX_EMOJIS_PER_SUBJECT);
});
