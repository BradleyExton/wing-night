// The chrome is lifted out of the footer's grid entirely — absolutely
// positioned over the band's own box, so the team bays keep every track to
// themselves and a layer can still paint outside the band (`floorShade`).
// Deliberately WITHOUT a z-index of its own: a stacking context here would
// trap the layers below the bays instead of letting them interleave.
export const frame = "pointer-events-none absolute inset-0";

// The deck's layers, back to front (DESIGN.md §2.2C). None of this is drawn in
// perspective: every layer is a flat gradient standing in for a piece of
// geometry, and together they describe a slab seen from a little above, lit by
// the hearth behind it.

// Nothing here paints outside the band. The footer sits above the stage in the
// display's stacking order, so a layer that reached up past the deck line
// would be drawn OVER the lobby cast — the birds would be behind the platform
// they are meant to be standing on. The floor they stand on is the stage's own
// (SetupStageBody `floor`), and it meets this band's tread at the deck line.

// The hearth's light pooling on the slab: brightest under the flame, gone by
// the outer bays. This is what keeps the deck part of the room rather than a
// bar bolted across the bottom of the screen.
export const wash =
  "pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_52%_135%_at_50%_0%,rgba(249,115,22,0.18)_0%,transparent_70%)]";

// One shading over the whole band, above the bay tints and under the type.
// This is the layer that makes four tinted rectangles read as ONE slab: a
// single light direction crossing every panel joint, so the eye takes the
// joints as seams in a surface rather than as the edges of four cards.
export const sheen =
  "pointer-events-none absolute inset-0 z-[2] bg-[linear-gradient(180deg,rgba(255,236,214,0.13)_0%,rgba(255,236,214,0.03)_18%,transparent_48%,rgba(0,0,0,0.2)_78%,rgba(0,0,0,0.5)_100%)]";

// The deck's TOP SURFACE, seen at a glancing angle — an unbroken strip across
// every bay, because the top of a stage is one plane however the face below it
// is panelled. Warm at its far edge where the flame reaches it, falling away
// toward the viewer.
export const tread =
  "pointer-events-none absolute inset-x-0 top-0 z-[3] h-[clamp(0.7rem,1.45vh,1.5rem)] bg-[linear-gradient(180deg,rgba(255,224,188,0.4)_0%,rgba(255,214,170,0.17)_40%,rgba(255,214,170,0.07)_100%)]";

// The front edge of the tread catching the light, as a specular sweep rather
// than a rule: hot in the middle where the flame is, gone at the corners.
export const lip =
  "pointer-events-none absolute inset-x-0 top-0 z-[4] h-[2px] bg-[linear-gradient(90deg,transparent_0%,rgba(255,179,90,0.3)_10%,rgba(255,232,204,0.9)_50%,rgba(255,179,90,0.3)_90%,transparent_100%)]";

// The nosing: the edging strip where the top rolls over into the face. A hard
// bright line immediately over a hard shadow is the whole trick — it is what
// reads as a thickness, and without it the tread is just a lighter stripe.
export const nosing =
  "pointer-events-none absolute inset-x-0 z-[3] top-[clamp(0.7rem,1.45vh,1.5rem)] h-[clamp(0.25rem,0.5vh,0.5rem)] bg-[linear-gradient(180deg,rgba(255,238,216,0.5)_0%,rgba(255,214,170,0.14)_30%,rgba(0,0,0,0.42)_75%,rgba(0,0,0,0.6)_100%)]";

// The underside, in its own shadow. Nothing is below it on a TV, which is the
// point: the slab has a shaded foot instead of bleeding off the panel.
export const plinth =
  "pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-[clamp(0.55rem,1.1vh,1.15rem)] bg-[linear-gradient(180deg,transparent_0%,rgba(0,0,0,0.55)_100%)]";
