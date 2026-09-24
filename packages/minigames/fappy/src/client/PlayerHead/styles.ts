// One face, sized by whoever holds it. Nothing here sets a width or a height:
// the head fills its box, so the 40px lineup chip on the tablet, the 64px one
// on the wall, the ready poster and the waiter's peek bubble all draw the same
// component with no size flag between them.

// A generated head is a photograph whose background was already flooded to
// alpha, so it crops into the disc rather than sitting in a square on it.
export const photo = "h-full w-full object-cover";

// No photo, but a name: the initials, in the team's colour. Drawn as SVG text
// in a 40-unit box rather than as sized type, so they scale with the disc for
// nothing — which is why this file needs no `em` arithmetic.
export const initials = "h-full w-full bg-text/[0.06]";

export const initialsText =
  "fill-current text-[17px] font-black uppercase [dominant-baseline:central] [text-anchor:middle]";

// Nobody on the roster for this leg: the house hen, from the cast, in the
// team's colour — never a second drawing of a bird.
export const hen = "flex h-full w-full items-center justify-center bg-text/[0.06] p-[8%]";
