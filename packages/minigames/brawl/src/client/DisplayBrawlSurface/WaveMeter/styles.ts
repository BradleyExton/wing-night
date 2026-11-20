// The wave meter hangs over the top of the arena, centred in the street's sky: the room's count of
// the wave in hand (docs/minigame-design-principles.md §3). A dark plate so it reads over any of
// the three settings' skies; nothing behind it is the fight. Dark and NOT frosted: a backdrop blur
// over a picture that moves every frame has to be blurred again every frame, which is what made
// the lobby's parade stutter.
export const strip =
  "group pointer-events-none absolute left-1/2 top-[clamp(0.6rem,1.4vh,1.4rem)] z-10 flex max-w-[94%] -translate-x-1/2 items-center gap-[clamp(0.8rem,1.4vw,1.6rem)] rounded-full bg-bg/80 px-[clamp(1rem,1.6vw,1.8rem)] py-[clamp(0.4rem,0.8vh,0.8rem)] transition-opacity duration-300 data-[hidden=true]:opacity-0";

export const label =
  "whitespace-nowrap text-[clamp(1rem,1.35vw,1.6rem)] font-extrabold uppercase tracking-[0.24em] text-mutedWarm";

export const pips = "flex items-center gap-[clamp(0.25rem,0.5vw,0.6rem)] group-data-[dense=true]:gap-[clamp(0.15rem,0.3vw,0.35rem)]";

// ◀ / ▶ at the strip's two ends: which edge the pips beside it step in from, readable from a couch.
export const sideMarker = "text-[clamp(0.9rem,1.2vw,1.4rem)] font-extrabold leading-none text-mutedWarm";

// A pip is a goon: an empty dashed ring while it is still to come, a solid ring while it stands
// on the street, filled gold once it is down. The heavier goons are bigger pips — a raccoon, a
// swan and a helmet goose are worth two, the boss four — so the room can see what is left is
// worth having. A crew of five's wave is too many pips for the full size, so a dense wave draws
// every one at two thirds.
const pipBase =
  "block shrink-0 rounded-full border-[3px] border-dashed border-text/60 transition-[background-color,border-color,transform] duration-200 data-[state=in]:border-solid data-[state=in]:border-text data-[state=down]:border-solid data-[state=down]:border-gold data-[state=down]:bg-gold data-[state=down]:shadow-[0_0_12px_theme(colors.gold/60%)] group-data-[dense=true]:border-2";

export const pip = `${pipBase} h-[clamp(1.2rem,1.8vw,2.2rem)] w-[clamp(1.2rem,1.8vw,2.2rem)] group-data-[dense=true]:h-[clamp(0.8rem,1.2vw,1.45rem)] group-data-[dense=true]:w-[clamp(0.8rem,1.2vw,1.45rem)]`;

export const pipHeavy = `${pipBase} h-[clamp(1.6rem,2.4vw,2.9rem)] w-[clamp(1.6rem,2.4vw,2.9rem)] group-data-[dense=true]:h-[clamp(1.05rem,1.6vw,1.95rem)] group-data-[dense=true]:w-[clamp(1.05rem,1.6vw,1.95rem)]`;

export const pipBoss = `${pipBase} h-[clamp(2rem,3vw,3.6rem)] w-[clamp(2rem,3vw,3.6rem)] group-data-[dense=true]:h-[clamp(1.35rem,2vw,2.4rem)] group-data-[dense=true]:w-[clamp(1.35rem,2vw,2.4rem)]`;

// GO ▶, lit once the wave is down and the camera lets go: the same word the scene flashes at the
// street's edge, here where the count was.
export const go =
  "hidden whitespace-nowrap font-score text-[clamp(1.3rem,2vw,2.4rem)] font-extrabold leading-none tracking-[0.12em] text-gold group-data-[brawl-wave-clear=true]:inline motion-safe:group-data-[brawl-wave-clear=true]:animate-pulse";
