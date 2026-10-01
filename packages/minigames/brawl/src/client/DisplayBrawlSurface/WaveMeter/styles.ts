// The wave meter hangs over the top of the arena, centred in the street's sky: the room's count of
// the wave in hand (docs/minigame-design-principles.md §3). A dark glass plate so it reads over any
// of the three settings' skies; nothing behind it is the fight.
export const strip =
  "group pointer-events-none absolute left-1/2 top-[clamp(0.6rem,1.4vh,1.4rem)] z-10 flex -translate-x-1/2 items-center gap-[clamp(0.8rem,1.4vw,1.6rem)] rounded-full bg-bg/70 px-[clamp(1rem,1.6vw,1.8rem)] py-[clamp(0.4rem,0.8vh,0.8rem)] backdrop-blur-sm transition-opacity duration-300 data-[hidden=true]:opacity-0";

// One group per wave, only the wave in hand shown: the painter marks it `data-current`.
export const group = "hidden items-center gap-[clamp(0.8rem,1.4vw,1.6rem)] data-[current=true]:flex";

export const label =
  "whitespace-nowrap text-[clamp(1rem,1.35vw,1.6rem)] font-extrabold uppercase tracking-[0.24em] text-mutedWarm";

export const pips = "flex items-center gap-[clamp(0.35rem,0.6vw,0.7rem)]";

// A pip is a goon: an empty ring while it is still to come, a solid ring while it stands on the
// street, filled gold once it is down. The heavier goons are bigger pips — a raccoon is worth two,
// the boss four — so the room can see what is left is worth having.
const pipBase =
  "block rounded-full border-[3px] border-text/60 border-dashed transition-[background-color,border-color,transform] duration-200 data-[state=in]:border-solid data-[state=in]:border-text data-[state=down]:border-solid data-[state=down]:border-gold data-[state=down]:bg-gold data-[state=down]:shadow-[0_0_12px_theme(colors.gold/60%)] motion-safe:data-[state=down]:scale-110";

export const pip = `${pipBase} h-[clamp(1.2rem,1.8vw,2.2rem)] w-[clamp(1.2rem,1.8vw,2.2rem)]`;

export const pipHeavy = `${pipBase} h-[clamp(1.6rem,2.4vw,2.9rem)] w-[clamp(1.6rem,2.4vw,2.9rem)]`;

export const pipBoss = `${pipBase} h-[clamp(2rem,3vw,3.6rem)] w-[clamp(2rem,3vw,3.6rem)]`;

// GO ▶, lit once the wave is down and the camera lets go: the same word the scene flashes at the
// street's edge, here where the count was.
export const go =
  "hidden whitespace-nowrap font-score text-[clamp(1.3rem,2vw,2.4rem)] font-extrabold leading-none tracking-[0.12em] text-gold group-data-[brawl-wave-clear=true]:inline motion-safe:group-data-[brawl-wave-clear=true]:animate-pulse";
