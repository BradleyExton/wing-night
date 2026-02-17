import { Phase, type RoomState } from "@wingnight/shared";

import {
  containerClassName,
  contentClassName,
  headingClassName,
  roundDetailsCardClassName,
  roundDetailsHeadingClassName,
  roundDetailsRowClassName,
  subtextClassName
} from "./styles";
import { displayPlaceholderCopy } from "./copy";

type DisplayPlaceholderProps = {
  roomState: RoomState | null;
};

export const DisplayPlaceholder = ({
  roomState
}: DisplayPlaceholderProps): JSX.Element => {
  const isRoundIntroPhase = roomState?.phase === Phase.ROUND_INTRO;
  const currentRoundConfig = roomState?.currentRoundConfig ?? null;

  const shouldRenderRoundDetails = isRoundIntroPhase && currentRoundConfig !== null;

  return (
    <main className={containerClassName}>
      <div className={contentClassName}>
        <h1 className={headingClassName}>{displayPlaceholderCopy.title}</h1>
        <p className={subtextClassName}>{displayPlaceholderCopy.description}</p>

        {!roomState && (
          <p className={subtextClassName}>{displayPlaceholderCopy.waitingForStateLabel}</p>
        )}

        {roomState && !shouldRenderRoundDetails && (
          <p className={subtextClassName}>{displayPlaceholderCopy.roundFallbackLabel}</p>
        )}

        {shouldRenderRoundDetails && (
          <section className={roundDetailsCardClassName}>
            <h2 className={roundDetailsHeadingClassName}>
              {displayPlaceholderCopy.roundIntroTitle(
                currentRoundConfig.round,
                currentRoundConfig.label
              )}
            </h2>
            <p className={roundDetailsRowClassName}>
              {displayPlaceholderCopy.roundSauceSummary(currentRoundConfig.sauce)}
            </p>
            <p className={roundDetailsRowClassName}>
              {displayPlaceholderCopy.roundMinigameSummary(
                currentRoundConfig.minigame
              )}
            </p>
          </section>
        )}
      </div>
    </main>
  );
};
