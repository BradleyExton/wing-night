import { ControlDeck } from "../ControlDeck";
import { StageHero } from "../StageHero";
import { hostControlPanelCopy } from "../../copy";
import * as styles from "./styles";

export const WaitingStage = (): JSX.Element => {
  return (
    <>
      <StageHero>
        <span className={styles.eyebrow}>{hostControlPanelCopy.headerKickerLabel}</span>
        <h1 className={styles.headline}>{hostControlPanelCopy.headerWaitingTitle}</h1>
        <p className={styles.meta}>{hostControlPanelCopy.headerWaitingDescription}</p>
      </StageHero>
      <ControlDeck>
        <></>
      </ControlDeck>
    </>
  );
};
