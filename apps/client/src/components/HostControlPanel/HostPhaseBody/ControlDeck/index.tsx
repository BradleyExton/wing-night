import type { ReactNode } from "react";
import { Settings2 } from "lucide-react";

import { hostControlPanelCopy } from "../../copy";
import * as styles from "./styles";

type ControlDeckProps = {
  showOverridesButton: boolean;
  overridesShowBadge: boolean;
  onOpenOverrides: () => void;
  children: ReactNode;
};

export const ControlDeck = ({
  showOverridesButton,
  overridesShowBadge,
  onOpenOverrides,
  children
}: ControlDeckProps): JSX.Element => {
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
