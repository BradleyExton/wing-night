// The online rooms run the shared minigame packages' runtimes (packages/minigames/*), which also
// draw in a browser. One of them names `window` in code a room never calls: the core package's
// beat loop (packages/minigames/core/src/beatLoop), reached only from a surface's animation. The
// Worker's types are workerd's with no DOM (tsconfig.json), so this names just enough of `window`
// for those two lines to typecheck. It is a type and nothing else: no `window` exists in a Worker,
// and nothing on the Worker's own path may use one.
declare const window: {
  requestAnimationFrame: (callback: (timeMs: number) => void) => number;
  cancelAnimationFrame: (handle: number) => void;
};
