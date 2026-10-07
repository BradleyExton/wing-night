import * as shellStyles from "../../PortalShell/styles";
import { TvHint } from "../TvHint";
import { scanTheTvCardCopy } from "./copy";
import * as styles from "./styles";

// No join token, or one Reset Game rotated: the only way in is the TV's QR.
export const ScanTheTvCard = (): JSX.Element => {
  return (
    <section className={shellStyles.card} data-player-scan-tv>
      <p className={shellStyles.eyebrow}>{scanTheTvCardCopy.eyebrow}</p>
      <h1 className={styles.title}>{scanTheTvCardCopy.title}</h1>
      <TvHint text={scanTheTvCardCopy.instruction} />
      <p className={shellStyles.fine}>{scanTheTvCardCopy.hint}</p>
    </section>
  );
};
