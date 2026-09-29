export type CountdownParts = {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
};

const pad = (value: number): string => String(value).padStart(2, "0");

// Whole units left, floored; zero everywhere once the night has started.
export const resolveCountdownParts = (remainingMs: number): CountdownParts => {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));

  return {
    days: pad(Math.floor(totalSeconds / 86_400)),
    hours: pad(Math.floor((totalSeconds % 86_400) / 3600)),
    minutes: pad(Math.floor((totalSeconds % 3600) / 60)),
    seconds: pad(totalSeconds % 60)
  };
};

export const teaserCountdownCopy = {
  units: [
    { key: "days", label: "Days" },
    { key: "hours", label: "Hrs" },
    { key: "minutes", label: "Min" },
    { key: "seconds", label: "Sec" }
  ] as const satisfies ReadonlyArray<{ key: keyof CountdownParts; label: string }>,
  unsetValue: "--",
  unsetCaption: "Date to be announced",
  scheduledCaption: (startsAtMs: number): string =>
    new Date(startsAtMs).toLocaleString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    })
} as const;
