import { PLAYER_CLAIM_GONE_REASONS, type PlayerClaimGoneReason } from "@wingnight/shared";

import * as shellStyles from "../../PortalShell/styles";
import { claimGoneCardCopy } from "./copy";
import * as styles from "./styles";

type ClaimGoneCardProps = {
  playerId: string | null;
  reason: PlayerClaimGoneReason;
  onPickAgain: () => void;
  onPlayHere: (playerId: string) => void;
};

// The face came off this phone without the phone asking: the host freed it,
// the roster changed, or another screen took it. Back to the picker — except
// when the face just moved to another tab, which this phone can take back.
export const ClaimGoneCard = ({
  playerId,
  reason,
  onPickAgain,
  onPlayHere
}: ClaimGoneCardProps): JSX.Element => {
  const lines = claimGoneCardCopy.lines(reason);
  const canPlayHere = reason === PLAYER_CLAIM_GONE_REASONS.SUPERSEDED && playerId !== null;

  return (
    <section className={shellStyles.card} data-player-claim-gone={reason}>
      <p className={shellStyles.eyebrow}>{claimGoneCardCopy.eyebrow}</p>
      <h1 className={styles.title}>{lines.title}</h1>
      <p className={shellStyles.voice}>{lines.voice}</p>
      <button
        type="button"
        className={shellStyles.buttonPrimary}
        onClick={(): void => {
          if (canPlayHere) {
            onPlayHere(playerId);
            return;
          }

          onPickAgain();
        }}
      >
        {canPlayHere ? claimGoneCardCopy.playHere : claimGoneCardCopy.pickAgain}
      </button>
    </section>
  );
};
