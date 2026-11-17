// /me/wardrobe, in the portal's Hearth: the stage on top, pinned; the Looks; the rail to mix
// your own; the team at the foot, each a portal card. (The tiles, the stage and the team are
// mockups/cast/wardrobe-picker.html's; the page departs from its Looks row and its slot tabs.)
// `group/beat` as on the TV's root (DisplayBoard/styles): the page's beat clock flips `data-beat`
// here and the dancing team answers it.
export const cards = "group/beat flex flex-col gap-4";

// The stage's dock: it sticks to the top of the screen, so the bird a tap dresses is in view
// wherever on the page the tap lands. It bleeds to the screen's edges over the page's own `bg`,
// so the Looks and the rail scroll under it and not round it. On a screen too short to spare the
// room (a phone on its side) it scrolls away with the rest.
export const stageDock =
  "z-20 -mx-4 -my-2 px-4 py-2 [@media(min-height:520px)]:sticky [@media(min-height:520px)]:top-0 [@media(min-height:520px)]:bg-bg/95 [@media(min-height:520px)]:[box-shadow:0_8px_16px_-12px_theme(colors.shade)]";

// Two lines at most, so a long outfit never grows the pinned stage over the page.
export const statusLine = "line-clamp-2 min-h-[2.6em] min-w-0 flex-1";

// What reaches the TV, in one line under the team.
export const fine = "m-0 text-[0.8rem] leading-snug text-mutedWarmDim";

// A whole page that is one message (no team yet): the message, then the way back.
export const notice = "flex flex-col items-start gap-3";
