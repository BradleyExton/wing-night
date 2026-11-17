// The phone is a controller, edge to edge, at its own size: a thumb's travel is measured in the
// phone's real pixels, so nothing here scales the pad the way a game's canvas is scaled.
export const screen = "fixed inset-0 overflow-hidden bg-bg text-text";

export const loading = "flex h-full w-full items-center justify-center text-base italic text-muted";

// Two thumbs need the phone on its side; upright it is asked to turn, over everything.
export const rotate =
  "fixed inset-0 z-40 hidden flex-col items-center justify-center gap-2 bg-bg px-8 text-center portrait:flex";

export const rotateTitle = "m-0 text-2xl font-black uppercase leading-tight text-text";

export const rotateBody = "m-0 font-voice text-lg italic text-mutedWarm";

export const rotateLockHint = "m-0 mt-4 text-sm text-mutedWarm/80";
