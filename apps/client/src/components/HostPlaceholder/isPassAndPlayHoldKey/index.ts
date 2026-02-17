const PASS_AND_PLAY_HOLD_KEYS = new Set([" ", "Spacebar", "Enter"]);

export const isPassAndPlayHoldKey = (key: string): boolean => {
  return PASS_AND_PLAY_HOLD_KEYS.has(key);
};
