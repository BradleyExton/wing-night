export type PressAndHoldHandlers = {
  start: () => void;
  cancel: () => void;
};

type CreatePressAndHoldHandlersParams = {
  holdDurationMs: number;
  onHoldComplete: () => void;
};

export const createPressAndHoldHandlers = ({
  holdDurationMs,
  onHoldComplete
}: CreatePressAndHoldHandlersParams): PressAndHoldHandlers => {
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

  const cancel = (): void => {
    if (timeoutHandle === null) {
      return;
    }

    clearTimeout(timeoutHandle);
    timeoutHandle = null;
  };

  const start = (): void => {
    cancel();
    timeoutHandle = setTimeout(() => {
      timeoutHandle = null;
      onHoldComplete();
    }, holdDurationMs);
  };

  return {
    start,
    cancel
  };
};
