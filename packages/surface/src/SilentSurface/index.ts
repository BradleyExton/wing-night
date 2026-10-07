import { createContext, createElement, useContext, type ReactNode } from "react";

const SilentSurfaceContext = createContext(false);

// A subtree that draws a surface but is not the room's speaker: the host tablet watching the TV's
// own picture while a contestant's phone plays the leg. The TV is the room's only speaker, so a
// display surface mirrored anywhere else must not make a sound — and a display surface has no
// seat to ask (it was only ever drawn on the TV). Every board a surface plays through
// (`useGameSoundboard`, `useHouseSoundboard`) reads this, so wrapping the mirror is the whole job.
// A provider and nothing else, so it is written without JSX: there is nothing here to style.
export const SilentSurface = ({ children }: { children: ReactNode }): JSX.Element => {
  return createElement(SilentSurfaceContext.Provider, { value: true }, children);
};

export const useIsSilentSurface = (): boolean => {
  return useContext(SilentSurfaceContext);
};
