import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";

// The body is drawn twice, the second time only to paint the Top over the
// wing, and each copy's loops (a breath, a walk's bob, a jig's hop) start when
// that copy mounts. A bird dressed mid-parade mounts its Top's copy late, and
// ran out of step with its own body until its next pose change; this sets each
// of the copy's loops to start when the body's own did — the same keyframes
// from the same start, frame for frame. A beat's transition is not a loop and
// is left to the room's beat.
const RIG_LAYERS = ['[data-character-jig="body"]', '[data-character-part="body"]'];

type Root = Pick<Element, "querySelector">;

export const syncBodyLoops = (body: Root | null, copy: Root | null): void => {
  for (const selector of RIG_LAYERS) {
    const from = body?.querySelector(selector);
    const to = copy?.querySelector(selector);

    if (from == null || to == null || typeof to.getAnimations !== "function") {
      continue;
    }

    const loops = from.getAnimations().filter((animation): animation is CSSAnimation => "animationName" in animation);

    for (const animation of to.getAnimations()) {
      const lead = "animationName" in animation ? loops.find((loop) => loop.animationName === animation.animationName) : undefined;

      if (lead?.startTime != null) {
        animation.startTime = lead.startTime;
      }
    }
  }
};

// Before a paint where there is a DOM; the server renders no loops (and React
// warns about a layout effect there).
const useBeforePaint = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Refs for the body's part and the Top's copy of it, kept in step whenever a Top is put on. */
export const useSyncedBodyLoops = (
  topDrawn: boolean
): { bodyRef: RefObject<SVGGElement>; topRef: RefObject<SVGGElement> } => {
  const bodyRef = useRef<SVGGElement>(null);
  const topRef = useRef<SVGGElement>(null);

  useBeforePaint(() => {
    if (topDrawn) {
      syncBodyLoops(bodyRef.current, topRef.current);
    }
  }, [topDrawn]);

  return { bodyRef, topRef };
};
