/**
 * The hen's hearts, written straight into the chrome from the paint loop: the view only knows a
 * block's hearts once it is refereed, and for the seventy-five seconds that matter the room is
 * watching the sim's own frame. A DOM write rather than state, for the reason the scene paints
 * through refs — this runs sixty times a second and nothing else on the surface changes.
 *
 * The element carries one child per heart; each is marked lit or not with `data-lit`, and its
 * styles say what lit looks like. Only what changed is written.
 */
export const paintHearts = (element: HTMLElement | null, hearts: number): void => {
  if (element === null) {
    return;
  }

  const text = `${hearts}`;

  if (element.getAttribute("data-brawl-hearts") === text) {
    return;
  }

  element.setAttribute("data-brawl-hearts", text);
  Array.from(element.children).forEach((child, index) => {
    child.setAttribute("data-lit", index < hearts ? "true" : "false");
  });
};
