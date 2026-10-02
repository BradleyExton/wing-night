import { readoutFigure } from "@wingnight/surface";

// The hearts, three glyphs or four (a heart bought at the handoff), lit and dimmed by the paint
// loop (`hearts/`): heat while they stand and a ghost of themselves once they are gone, so a hit
// reads from across the room.

// The tablet's counter chip sets the row's size, face and spacing; the glyphs sit shoulder to shoulder in it.
export const chromeRow = "inline";

// The marquee sets the readout's label type (DESIGN.md §2.2D); the glyphs wear the house figure.
export const marqueeRow = `${readoutFigure} flex gap-[0.12em]`;

export const heart = "text-heat transition-opacity duration-150 data-[lit=false]:text-muted data-[lit=false]:opacity-30";
