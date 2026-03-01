type EmitSocket<EventName extends string, Payload> = {
  emit: (event: EventName, payload: Payload) => void;
};

type RequestSocketHarness<EventName extends string, Payload> = {
  socket: EmitSocket<EventName, Payload>;
  emittedPayloads: Payload[];
};

export const createRequestSocketHarness = <
  EventName extends string,
  Payload
>(
  expectedEvent: EventName
): RequestSocketHarness<EventName, Payload> => {
  const emittedPayloads: Payload[] = [];

  return {
    socket: {
      emit: (event: EventName, payload: Payload): void => {
        if (event === expectedEvent) {
          emittedPayloads.push(payload);
        }
      }
    },
    emittedPayloads
  };
};

type MissingHostSecretTracker = {
  onMissingHostSecret: () => void;
  readCallCount: () => number;
};

export const createMissingHostSecretTracker = (): MissingHostSecretTracker => {
  let callCount = 0;

  return {
    onMissingHostSecret: (): void => {
      callCount += 1;
    },
    readCallCount: (): number => callCount
  };
};
