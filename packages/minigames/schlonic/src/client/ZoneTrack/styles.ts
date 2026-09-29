// The zone strip between the TV's marquee and the arena: the whole run as one line, start to
// post, at the same height and width FAPPY's pace track takes (one bird-head tall, the bar
// drawn through it), so the two twitch games read as one picture on the wall.
export const container = "relative mx-auto h-[clamp(1.5rem,2.1vh,1.9rem)] w-[min(72%,60rem)] shrink-0";

// The run, start to post. Centred on the row so the pins ride it.
export const rail = "absolute inset-x-0 top-1/2 h-[0.3rem] -translate-y-1/2 rounded-full bg-text/10";

// Every position below is a custom property or a class the strip writes — the house rule bans a
// JSX `style` prop. The hazards, rails and trenches are laid out once per zone; only the runner's pin
// moves, and it moves through ONE property the paint loop writes on the root sixty times a
// second (`zoneTrack/paintZoneTrack`), never through React.
export const railRun = "absolute inset-y-0 left-0 w-[var(--schlonic-track-run,0%)] rounded-full bg-gold/45";

// Every static mark sits at `--schlonic-track-at`, which the component writes on the element
// as it mounts; a hole is a gap in the rail and is drawn as one, the page's own dark over the
// bar, `--schlonic-track-width` wide.
const at = "left-[var(--schlonic-track-at,0%)]";

export const pit = `absolute ${at} top-1/2 h-[0.5rem] w-[var(--schlonic-track-width,2%)] -translate-y-1/2 bg-bg`;

// The two marks on the line, in the scene's own materials (DESIGN.md §2.11): one of the crowd
// is a dark dot — the crow's black, whoever it is, because the strip says WHERE, not who — and
// a kicker is a plywood wedge. Scene art, not chrome.
const mark = `absolute ${at} top-1/2 -translate-x-1/2 -translate-y-1/2`;

export const hazard = `${mark} h-[0.8rem] w-[0.8rem] rounded-full bg-[#2b2b30] shadow-[0_0_0_0.1rem_#d8dde3]`;

export const kicker = `${mark} h-[0.7rem] w-[0.9rem] rounded-sm bg-[#e3b774] shadow-[0_0_0_0.08rem_#5b4a33] [clip-path:polygon(0_100%,100%_0,100%_100%)]`;

// A grind rail: a thin steel bar raised over the line for the rail's whole length, in the rail's
// own steel and edge — kit to aim for, so it stands off the line rather than sitting on it as a
// hazard does. Scene art, not chrome (DESIGN.md §2.11).
const sceneRailSteel = "bg-[#aab5bf] shadow-[0_0_0_0.08rem_#1f262c]";

export const grindRail = `absolute ${at} top-[12%] h-[0.22rem] w-[var(--schlonic-track-width,4%)] rounded-full ${sceneRailSteel}`;

// A handoff: where one leg's post is the next leg's start line, a pale tick through the bar,
// shorter than the post so the end of the street still reads as the end.
export const handoff = `absolute ${at} top-1/2 h-[0.7rem] w-[0.12rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-text/40`;

// The post: the finish, in gold like FAPPY's par tick.
export const post = "absolute right-0 top-1/2 h-[0.85rem] w-[0.14rem] translate-x-1/2 -translate-y-1/2 rounded-full bg-gold";

// Where an earlier run of this turn ended, in the team's colour: a cleared run sits on the
// post, a wipeout or a fall where it went wrong. Faint, so the live pin wins.
export const runPin = `absolute ${at} top-1/2 h-[0.6rem] w-[0.6rem] -translate-x-1/2 -translate-y-1/2 rounded-full border-[0.1rem] border-current bg-bg opacity-60`;

// The live runner, placed by the paint loop. The player's own head, in the team's colour, the
// same figure the arena draws — it moves every frame, so no transition.
export const runnerMark =
  "absolute left-[var(--schlonic-track-run,0%)] top-1/2 aspect-square h-full w-[auto] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border-[0.12rem] border-current bg-bg shadow-[0_0_0.5rem_currentColor]";

// The run to beat, placed by its own replay on the same tick. Faint, because it is not in the
// race — it is the race's shadow — and under the runner in the stacking order.
export const ghostMark =
  "pointer-events-none absolute left-[var(--schlonic-track-ghost,0%)] top-1/2 aspect-square h-[115%] w-[auto] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border-[0.1rem] border-current bg-bg opacity-50";

export const runnerPhoto = "h-full w-full object-cover";

export const runnerHen = "flex h-full w-full items-center justify-center p-[8%]";

export const label = "sr-only";
