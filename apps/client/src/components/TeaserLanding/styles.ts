// The lobby's stage (SetupStageBody/styles `container`), grown to a scrolling page: a phone is
// taller than it is wide, so the cards stack under the countdown and the page is at least one
// screen tall with the parade's floor held clear at the bottom.
export const container =
  "relative isolate flex min-h-[100dvh] flex-col items-center gap-[clamp(1.5rem,4vh,2.5rem)] overflow-hidden px-4 pb-[clamp(9rem,22vh,15rem)] pt-[clamp(2.5rem,8vh,5rem)] text-center";

// The parade's own strip is sized for a TV floor; on the teaser it is pinned to the page's foot
// and gets the height a phone can spare, so the birds are big enough to tell whose face it is.
export const paradeStrip =
  "pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[clamp(8rem,20vh,14rem)] [&>[data-cast-parade]]:h-full";

export const heading = `setup-wordmark m-0 text-[clamp(3.4rem,17vw,9rem)] font-black uppercase leading-[0.9] tracking-[-0.02em] [animation:heroReveal_900ms_cubic-bezier(0.2,0.7,0.2,1)_120ms_both,shine_9s_ease-in-out_2.4s_infinite] motion-reduce:[animation:none]`;

export const tagline =
  "m-0 max-w-[22rem] font-voice text-[clamp(1.05rem,4.2vw,1.4rem)] italic leading-snug text-mutedWarm";

export const games = "relative z-[2] flex w-full max-w-[56rem] flex-col items-center gap-3";

export const gamesHeading =
  "m-0 text-xs font-extrabold uppercase tracking-[0.42em] text-mutedWarm";

export const gameGrid = "grid w-full grid-cols-1 gap-3 sm:grid-cols-3";
