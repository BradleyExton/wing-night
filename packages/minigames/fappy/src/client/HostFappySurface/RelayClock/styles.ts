// The relay clock: the one number the tablet holder should feel. It rides in
// the Canvas's `counter` slot (docs/takeover-layout-api.md §5) rather than on a
// rail of FAPPY's own, so it is glass like the counts beside it — it floats
// over the corridor's sky now — and it no longer pushes itself right with
// `ml-auto`: the chrome row places it, last, where the shell's own clock would
// be if this game had one.
export const container =
  "inline-flex min-h-9 items-baseline gap-2 rounded-full border border-text/10 bg-bg/85 px-3.5 py-1.5 font-mono text-base tracking-normal text-text backdrop-blur";

export const containerPastPar = "text-gold";

export const containerUrgent = "text-heat";

export const limit = "text-xs text-mutedWarmDim";
