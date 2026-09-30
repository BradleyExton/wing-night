// The lobby's stage (SetupStageBody/styles `container`) on a phone held upright: one screen,
// no scroll. Three bands top to bottom — the wordmark, the countdown, the games — centred in
// the room above a floor the parade owns (the bottom padding, matched to `paradeStrip`). Every
// height is in viewport units so the bands shrink together on a short phone rather than push
// the floor off the bottom, and the top padding keeps the eyebrow out from under a notch.
// `group/beat`, as on the TV's root (DisplayBoard/styles): `useBeatClock` flips `data-beat` here.
export const container =
  "group/beat relative isolate flex min-h-[100dvh] flex-col items-center justify-center gap-[clamp(0.9rem,2.6vh,2.5rem)] overflow-hidden px-4 pb-[clamp(7.5rem,17vh,13rem)] pt-[calc(env(safe-area-inset-top)+clamp(1rem,3vh,4rem))] text-center sm:px-8";

// The parade's own strip is sized for a TV floor; on the teaser it is pinned to the page's foot
// and gets the height a phone can spare, so the birds are big enough to tell whose face it is.
export const paradeStrip =
  "pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[clamp(7.5rem,17vh,13rem)] [&>[data-cast-parade]]:h-full";

export const header = "relative z-[2] flex flex-col items-center gap-[clamp(0.35rem,1vh,1.1rem)]";

// Two lines on a phone (WING / NIGHT), bounded by height as much as width so the pair never
// takes more than a fifth of the screen; a wide screen gets the lobby's own size back.
export const heading = `setup-wordmark m-0 text-[clamp(2.75rem,min(16vw,8.5vh),9rem)] font-black uppercase leading-[0.9] tracking-[-0.02em] [animation:heroReveal_900ms_cubic-bezier(0.2,0.7,0.2,1)_120ms_both,shine_9s_ease-in-out_2.4s_infinite] motion-reduce:[animation:none] sm:text-[clamp(4rem,11vh,9rem)]`;

export const tagline =
  "m-0 font-voice text-[clamp(1rem,min(4.2vw,2.2vh),1.4rem)] italic leading-snug text-mutedWarm";

export const taglineLine = "block";

// The games are a short list, one row each, the width of a phone on every screen: a row is
// read left to right and a wide screen gains nothing from three rows abreast.
export const games = "relative z-[2] flex w-full max-w-[26rem] flex-col items-center gap-[clamp(0.5rem,1.2vh,0.8rem)]";

export const gamesHeading =
  "m-0 text-[clamp(0.65rem,1.5vh,0.8rem)] font-extrabold uppercase tracking-[0.42em] text-mutedWarm";

export const gameList = "flex w-full flex-col gap-[clamp(0.45rem,1vh,0.75rem)]";
