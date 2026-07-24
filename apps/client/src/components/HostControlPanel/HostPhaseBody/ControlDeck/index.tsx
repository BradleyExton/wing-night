import type { ReactNode } from "react";
import { Settings2 } from "lucide-react";

import { useHostOverridesUi } from "../../../../context/HostOverridesUiContext";
import { hostControlPanelCopy } from "../../copy";
import * as styles from "./styles";

type ControlDeckProps = {
  children: ReactNode;
};

export const ControlDeck = ({ children }: ControlDeckProps): JSX.Element => {
  const { showOverridesButton, overridesShowBadge, onOpenOverrides } =
    useHostOverridesUi();

  return (
    <aside className={styles.root}>
      {children}
      {showOverridesButton && (
        <div className={styles.foot}>
          <button
            type="button"
            className={styles.overridesButton}
            onClick={onOpenOverrides}
            aria-label={hostControlPanelCopy.overridesTriggerOpenAriaLabel}
          >
            <Settings2 strokeWidth={2.2} className="h-4 w-4" />
            {hostControlPanelCopy.overridesTriggerButtonLabel}
            {overridesShowBadge && <span className={styles.overridesBadge} aria-hidden />}
          </button>
        </div>
      )}
    </aside>
  );
};
