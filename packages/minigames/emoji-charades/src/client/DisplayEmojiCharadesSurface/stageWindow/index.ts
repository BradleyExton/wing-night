// The TV shows the tail of the clue, not the whole of it: at most six emoji,
// each big enough to read from the sofa. The seventh pushes the first off the
// left end, and Back brings it back.
export const MAX_STAGE_EMOJIS = 6;

// How an emoji arrives. `hero` is the one the clue-giver just tapped: it pops
// up huge in the middle of the stage and then flies out to its place in the
// row. `settle` is everything else that appears — a board the TV joined late,
// or an earlier emoji sliding back in from the left after a Back — which only
// grows in where it stands, so two arrivals never fight over the centre.
export type StageEntrance = "hero" | "settle";

export type StageEmoji = {
  // The emoji's position in the whole clue plus the emoji itself. Position
  // alone would let a Back-then-retap swap the glyph without a new entrance.
  key: string;
  emoji: string;
  // Offset from the stage's centre in slots: -2.5 … 2.5 for a full row of six.
  slot: number;
  // How many emoji stood in the row, which sizes it. A leaving emoji keeps the
  // row it left, so a Clear shrinks the six away at the size they were rather
  // than ballooning them to the size an empty row would give one emoji.
  rowLength: number;
  entrance: StageEntrance;
  // On its way out: it keeps the slot it had and shrinks away where it stood,
  // while the row it left closes up around it.
  isLeaving: boolean;
};

const resolveStageKey = (index: number, emoji: string): string => {
  return `${index}:${emoji}`;
};

export const resolveVisibleWindow = (
  emojiSequence: string[]
): { key: string; emoji: string }[] => {
  const start = Math.max(0, emojiSequence.length - MAX_STAGE_EMOJIS);

  return emojiSequence.slice(start).map((emoji, offset) => ({
    key: resolveStageKey(start + offset, emoji),
    emoji
  }));
};

const resolveSlot = (position: number, count: number): number => {
  return position - (count - 1) / 2;
};

const resolveClueIndex = (entry: StageEmoji): number => {
  return Number.parseInt(entry.key, 10);
};

// Pure: the stage after the clue changed. Everything in the new window is on
// stage; anything that was on stage and is not any more stays, leaving, until
// the surface prunes it once its exit has played.
//
// The list is in clue order, leaving and staying alike, and it has to be: the
// surface renders it as keyed siblings, and a sibling React moves is detached
// and re-attached, which restarts its CSS animation. Leaving-first order made
// every Back re-pop the whole row.
export const reconcileStageEmojis = (
  previous: StageEmoji[],
  emojiSequence: string[],
  { isFirstReading }: { isFirstReading: boolean }
): StageEmoji[] => {
  const visibleWindow = resolveVisibleWindow(emojiSequence);
  const previousByKey = new Map(previous.map((entry) => [entry.key, entry]));
  const newestKey = visibleWindow[visibleWindow.length - 1]?.key ?? null;
  const previousNewestIndex = previous
    .filter((entry) => !entry.isLeaving)
    .reduce((highest, entry) => Math.max(highest, resolveClueIndex(entry)), -1);

  const onStage = visibleWindow.map(({ key, emoji }, position): StageEmoji => {
    const existing = previousByKey.get(key);
    const isFreshTap =
      !isFirstReading &&
      key === newestKey &&
      Number.parseInt(key, 10) > previousNewestIndex;

    return {
      key,
      emoji,
      slot: resolveSlot(position, visibleWindow.length),
      rowLength: visibleWindow.length,
      entrance:
        existing !== undefined && !existing.isLeaving
          ? existing.entrance
          : isFreshTap
            ? "hero"
            : "settle",
      isLeaving: false
    };
  });

  const onStageKeys = new Set(onStage.map((entry) => entry.key));
  const leaving = previous
    .filter((entry) => !onStageKeys.has(entry.key))
    .map((entry): StageEmoji => ({ ...entry, isLeaving: true }));

  // A stable sort, so where a leaving emoji and its replacement share a clue
  // index the one already in the DOM stays in front of the one arriving.
  return [...leaving, ...onStage].sort(
    (left, right) => resolveClueIndex(left) - resolveClueIndex(right)
  );
};

// The emoji whose pop this change should ring out, if any: a hero that was not
// already standing on the stage. A Back that leaves an earlier hero at the end
// of the row is not a new tap, so it rings nothing.
export const resolveFreshHeroKey = (
  previous: StageEmoji[],
  next: StageEmoji[]
): string | null => {
  const previouslyOnStage = new Set(
    previous.filter((entry) => !entry.isLeaving).map((entry) => entry.key)
  );
  const freshHero = next.find(
    (entry) =>
      !entry.isLeaving && entry.entrance === "hero" && !previouslyOnStage.has(entry.key)
  );

  return freshHero?.key ?? null;
};
