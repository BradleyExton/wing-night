// A small token bucket: `capacity` actions at once, refilled at
// `refillPerSecond`. Each `take` spends one token or says no. Time is injected
// (`now`) so a test can walk the clock instead of sleeping.
export type TokenBucketOptions = {
  capacity: number;
  refillPerSecond: number;
  now: () => number;
};

export type TokenBucket = {
  take: () => boolean;
};

export const createTokenBucket = ({ capacity, refillPerSecond, now }: TokenBucketOptions): TokenBucket => {
  let tokens = capacity;
  let refilledAt = now();

  return {
    take: (): boolean => {
      const at = now();

      tokens = Math.min(capacity, tokens + ((at - refilledAt) / 1000) * refillPerSecond);
      refilledAt = at;

      if (tokens < 1) {
        return false;
      }

      tokens -= 1;

      return true;
    }
  };
};
