/** The worth down over the course's worth, as the chrome writes it: "4 / 27". */
export const formatGoonsTally = (down: number, total: number): string => `${down} / ${total}`;

/**
 * The worth down, written straight into the chrome from the paint loop: what the team banked
 * before this block plus what the hen has put down in it so far. The view only banks a block once
 * it is refereed, and the room is watching the goons go down now (SCHLONIC's `wingTally`).
 *
 * It rewrites the text node React rendered rather than replacing it, so a later render from the
 * view (a reset, the next block's echo) still lands on the node that is on screen.
 */
export const paintGoonsTally = (element: HTMLElement | null, down: number, total: number): void => {
  if (element === null) {
    return;
  }

  const text = formatGoonsTally(down, total);
  const node = element.firstChild;

  if (node !== null && node.nodeType === 3 && node.nextSibling === null) {
    if (node.nodeValue !== text) {
      node.nodeValue = text;
    }

    return;
  }

  if (element.textContent !== text) {
    element.textContent = text;
  }
};

/** What a turn banked before this block: the floor the live tally counts up from. */
export const resolveGoonsBanked = (
  blocks: readonly { blockIndex: number; result: { goons: number } | null }[],
  blockIndex: number
): number => {
  return blocks.reduce((total, entry) => (entry.blockIndex < blockIndex ? total + (entry.result?.goons ?? 0) : total), 0);
};
