import type { SerializableValue } from "@wingnight/minigames-core";
import type { MinigamePlayerView } from "@wingnight/shared";

import { resolveMinigameRendererBundle } from "../../../minigames/registry";
import * as styles from "./styles";

type PhoneAnswerCardProps = {
  card: MinigamePlayerView;
  onAnswer: (actionType: string, actionPayload: SerializableValue) => void;
};

// A playing-team phone answering the question in hand: the game's own phone card
// (`MinigameRendererBundle.PlayerSurface`) in the phone's column, portrait. A game with no phone
// card draws nothing here, and the phone keeps the column it had.
export const PhoneAnswerCard = ({ card, onAnswer }: PhoneAnswerCardProps): JSX.Element | null => {
  const PlayerSurface = resolveMinigameRendererBundle(card.minigame)?.PlayerSurface;

  if (PlayerSurface === undefined) {
    return null;
  }

  return (
    <div className={styles.root} data-phone-answer-card={card.minigame}>
      <PlayerSurface minigamePlayerView={card} onDispatchAction={onAnswer} />
    </div>
  );
};
