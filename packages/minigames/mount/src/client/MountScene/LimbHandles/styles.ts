import type { MountLimbState } from "@wingnight/shared";

// The four limb handles (spec §0.5). On the tablet each is a ring a greasy thumb can find at the
// limb's tip, lit by what the limb is doing: a quiet ring while it hangs, the show's orange while a
// finger holds it, gold dashes while it is let go and looking for a hold, and a solid green grip
// once it has one. The touch itself is taken by distance in world units (`touchRadius`), not by
// hitting the ring, so the ring is a sign and never a target that has to be found to the pixel.
type LimbStateKind = MountLimbState["kind"];

export const hostRing: Record<LimbStateKind, string> = {
  limp: "fill-bg/35 stroke-text/70 [stroke-width:1.4]",
  held: "fill-primary/45 stroke-primary [stroke-width:2]",
  seeking: "fill-gold/20 stroke-gold [stroke-width:1.6] [stroke-dasharray:3_2]",
  grabbed: "fill-success/35 stroke-success [stroke-width:1.8]"
};

// The ring's centre: a dot that says where the grip actually is.
export const hostDot: Record<LimbStateKind, string> = {
  limp: "fill-text/80",
  held: "fill-text",
  seeking: "fill-gold",
  grabbed: "fill-success"
};

// On the wall the handles are only grip marks: a small dot on a limb that is holding something,
// and nothing on one that is not, so the room reads the holds without four rings on every bird.
export const displayRing: Record<LimbStateKind, string> = {
  limp: "fill-none stroke-none",
  held: "fill-primary/60 stroke-none",
  seeking: "fill-none stroke-gold/70 [stroke-width:0.8]",
  grabbed: "fill-success stroke-bg [stroke-width:0.8]"
};

export const displayDot: Record<LimbStateKind, string> = {
  limp: "fill-none",
  held: "fill-none",
  seeking: "fill-none",
  grabbed: "fill-none"
};
