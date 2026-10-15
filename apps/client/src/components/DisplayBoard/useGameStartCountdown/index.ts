import { useGameStartCountdownSeconds } from "../../../utils/useGameStartCountdownSeconds";

type UseGameStartCountdownProps = {
  gameStartCountdownEndsAt: number | null;
};

// The TV's reading of the server's count-in.
export const useGameStartCountdown = ({
  gameStartCountdownEndsAt
}: UseGameStartCountdownProps): number | null => {
  return useGameStartCountdownSeconds(gameStartCountdownEndsAt);
};
