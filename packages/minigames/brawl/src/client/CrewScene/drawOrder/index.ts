/**
 * How much further forward a figure has to be before it is drawn over the one it was behind.
 * A goon lines up on its hen's own line before it closes, so the two are a hair apart in depth
 * for most of a fight; without this they would swap places in the picture on every frame.
 */
export const DRAW_ORDER_SLACK = 1.5;

/**
 * The order to draw the street's figures in, back of the band first, so a nearer figure is drawn
 * over a further one — the only depth cue a flat brawler gets besides the shadows. `depths` is
 * every figure on the street by its key; `previous` is the order they were last drawn in.
 *
 * It is the previous order, repaired: figures that left are dropped, new ones join at the back,
 * and then each is moved forward past its neighbour only when it is clearly nearer the camera
 * (`DRAW_ORDER_SLACK`). So the order changes when two figures really cross and not while they
 * jostle on one line — and it changes by as few moves as that takes, which matters because the
 * order is the DOM's, and moving a node restarts the walk cycle on it.
 */
export const resolveDrawOrder = (previous: readonly string[], depths: ReadonlyMap<string, number>): string[] => {
  const kept = previous.filter((key) => depths.has(key));
  const known = new Set(kept);
  const order = [...kept, ...[...depths.keys()].filter((key) => !known.has(key))];
  const depthOf = (key: string): number => depths.get(key) ?? 0;

  for (let index = 1; index < order.length; index += 1) {
    const key = order[index] as string;
    const depth = depthOf(key);
    let at = index;

    while (at > 0 && depthOf(order[at - 1] as string) > depth + DRAW_ORDER_SLACK) {
      order[at] = order[at - 1] as string;
      at -= 1;
    }

    order[at] = key;
  }

  return order;
};
