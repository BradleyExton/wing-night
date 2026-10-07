import { createContext, useContext } from "react";
import type { ReactNode } from "react";

// The join token the TV's player QR carries. Only the laptop's own display is
// ever handed it (`display:playerJoinToken`, re-sent when Reset Game rotates
// it); everywhere else this is null and the QR card simply does not draw. A
// context rather than a prop because it is read four components below the
// board that owns the socket, by the SETUP stage alone.
const PlayerJoinTokenContext = createContext<string | null>(null);

type PlayerJoinTokenProviderProps = {
  value: string | null;
  children: ReactNode;
};

export const PlayerJoinTokenProvider = ({
  value,
  children
}: PlayerJoinTokenProviderProps): JSX.Element => {
  return <PlayerJoinTokenContext.Provider value={value}>{children}</PlayerJoinTokenContext.Provider>;
};

export const usePlayerJoinToken = (): string | null => {
  return useContext(PlayerJoinTokenContext);
};
