// The wardrobe's one beat, read where the beat clock leaves it: `data-beat` flipping on the page's
// root (`useBeatClock`, which the TV's dancing birds answer the same way). The team dances to it;
// these let the stage's Move and the Move tiles start on it too, so a Move tapped on the stage
// lands on the bar the parade is dancing and never half a beat off it.

/** Calls `onBeat` on every beat until the returned function is called. */
export const subscribeToBeat = (root: HTMLElement, onBeat: () => void): (() => void) => {
  const observer = new MutationObserver(onBeat);

  observer.observe(root, { attributes: true, attributeFilter: ["data-beat"] });

  return (): void => observer.disconnect();
};

/**
 * Runs `run` once, on the next beat — or after `maxWaitMs` when no beat comes, because the clock
 * does not run at all under reduced motion and a tap must still do what it says. The returned
 * function cancels it.
 */
export const runOnNextBeat = (root: HTMLElement | null, run: () => void, maxWaitMs: number): (() => void) => {
  let isDone = false;
  let unsubscribe = (): void => undefined;
  const fire = (): void => {
    if (isDone) {
      return;
    }

    isDone = true;
    unsubscribe();
    window.clearTimeout(timer);
    run();
  };
  const timer = window.setTimeout(fire, maxWaitMs);

  if (root !== null) {
    unsubscribe = subscribeToBeat(root, fire);
  }

  return (): void => {
    isDone = true;
    unsubscribe();
    window.clearTimeout(timer);
  };
};
