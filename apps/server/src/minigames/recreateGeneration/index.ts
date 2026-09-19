import { Phase, type RoomState } from "@wingnight/shared";

// The party-time side effect RECREATE needs and no other game has: when a
// team submits a prompt the reducer parks the attempt at `generating`, and
// something outside the pure runtime has to go and paint it. This runner is
// that something. It watches room state after every broadcast, starts the
// one call an attempt needs, and hands the result back as an ordinary
// `resolveGeneration` action — so the reducer stays pure and the snapshot
// stays the only truth.

export type RecreateAttemptGenerationInput = {
  attemptId: string;
  prompt: string;
  sourceImageSrc: string | null;
};

export type RecreateGenerationResult = {
  attemptId: string;
  imageSrc: string | null;
  failureReason: string | null;
};

// Resolves to the pack-relative path of the finished picture.
export type RecreateAttemptGenerator = (
  input: RecreateAttemptGenerationInput
) => Promise<string>;

export type RecreateGenerationRunner = {
  reconcile: (roomState: RoomState) => void;
};

type CreateRecreateGenerationRunnerInput = {
  // Null means no generator is configured (no key); every attempt then fails
  // straight away with a reason the host can read out.
  generateAttempt: RecreateAttemptGenerator | null;
  applyResult: (result: RecreateGenerationResult) => void;
  onError?: (attemptId: string, error: unknown) => void;
};

export const GENERATOR_UNAVAILABLE_REASON =
  "No image generator is configured. Set GEMINI_API_KEY in the content pack's .env.";

const describeError = (error: unknown): string => {
  return error instanceof Error ? error.message : String(error);
};

export const createRecreateGenerationRunner = ({
  generateAttempt,
  applyResult,
  onError
}: CreateRecreateGenerationRunnerInput): RecreateGenerationRunner => {
  const inflightAttemptIds = new Set<string>();
  // Kept after settling so an undo that restores a `generating` attempt gets
  // the same answer again instead of a second call to the model.
  const settledResultByAttemptId = new Map<string, RecreateGenerationResult>();

  const settle = (result: RecreateGenerationResult): void => {
    inflightAttemptIds.delete(result.attemptId);
    settledResultByAttemptId.set(result.attemptId, result);
    applyResult(result);
  };

  return {
    reconcile: (roomState) => {
      const hostView = roomState.minigameHostView;

      if (
        roomState.phase !== Phase.MINIGAME_PLAY ||
        hostView === null ||
        hostView.minigame !== "RECREATE" ||
        hostView.attempt === null ||
        hostView.attempt.status !== "generating"
      ) {
        return;
      }

      const { attemptId, prompt } = hostView.attempt;
      const settledResult = settledResultByAttemptId.get(attemptId);

      if (settledResult !== undefined) {
        applyResult(settledResult);
        return;
      }

      if (inflightAttemptIds.has(attemptId)) {
        return;
      }

      if (generateAttempt === null) {
        settle({ attemptId, imageSrc: null, failureReason: GENERATOR_UNAVAILABLE_REASON });
        return;
      }

      inflightAttemptIds.add(attemptId);

      generateAttempt({
        attemptId,
        prompt,
        sourceImageSrc: hostView.currentTarget?.sourceImageSrc ?? null
      }).then(
        (imageSrc) => {
          settle({ attemptId, imageSrc, failureReason: null });
        },
        (error: unknown) => {
          onError?.(attemptId, error);
          settle({ attemptId, imageSrc: null, failureReason: describeError(error) });
        }
      );
    }
  };
};
