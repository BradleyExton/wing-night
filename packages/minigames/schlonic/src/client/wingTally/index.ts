/**
 * The wings in hand, written straight into the chrome from the paint loop. Wings are the score
 * and the whole health bar (DESIGN.md §2.11), and the view's `wingsBanked` only moves once a run
 * is refereed — so for the seventeen seconds that matter the number the room is watching has to
 * come off the sim's own frame. A DOM write rather than state, for the same reason the scene
 * paints through refs: this runs sixty times a second and nothing else on the surface changes.
 */
export const paintWingTally = (element: HTMLElement | null, wings: number): void => {
  if (element === null) {
    return;
  }

  const text = `${wings}`;

  if (element.textContent !== text) {
    element.textContent = text;
  }
};
