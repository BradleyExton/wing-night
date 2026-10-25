// The crop fills its tile and clips there: the rest of the bird is outside the window on purpose.
export const crop = "block h-full w-full overflow-hidden";

// A crop of the bird draws it without its head: the cast's head part (the neck and the photo or
// drawn head on it) is hidden by its rig marker, and the body's own outline closes over the
// shoulder where the neck sat.
export const cropHeadless = `${crop} [&_[data-character-part=head]]:hidden`;
