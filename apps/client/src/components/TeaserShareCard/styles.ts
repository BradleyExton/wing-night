// Fixed at the share image's own size, whatever the window: the capture is the product.
export const container =
  "relative isolate flex h-[630px] w-[1200px] flex-col items-center overflow-hidden pt-[64px] text-center";

// The floor is most of the picture: the faces are the pitch.
export const paradeStrip =
  "pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[240px] [&>[data-cast-parade]]:h-full [&_[data-cast-group]]:h-[200px]";

export const heading =
  "setup-wordmark m-0 text-[156px] font-black uppercase leading-[0.9] tracking-[-0.02em]";
