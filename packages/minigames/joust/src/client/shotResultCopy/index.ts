// Shared by the host deck and the TV: what to call a shot, by how much of the
// rack it put on the sand. A miss is a miss; a clean sweep gets the only
// bonus in the game and says so.
export type JoustShotCopy = {
  title: string;
  blurb: string;
};

const MISS: JoustShotCopy = { title: "Whiff", blurb: "The desert claims another." };
const RACK_CLEARED: JoustShotCopy = {
  title: "Rack cleared!",
  blurb: "Nobody left standing. Bonus on the board."
};
const SINGLE: JoustShotCopy = { title: "One down", blurb: "Clean contact. Off they go." };
const PILE_UP: JoustShotCopy = { title: "Pile-up", blurb: "They went down like dominoes." };

export const resolveShotCopy = (toppledCount: number, isRackCleared: boolean): JoustShotCopy => {
  if (isRackCleared) {
    return RACK_CLEARED;
  }

  if (toppledCount <= 0) {
    return MISS;
  }

  return toppledCount === 1 ? SINGLE : PILE_UP;
};
