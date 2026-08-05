// PROTOTYPE (throwaway) — floating variant switcher. Navigates via the
// ?variant= URL param so a pick is shareable and survives reload.
import { useEffect } from "react";

import * as styles from "./styles";

export const CONFIG_PROTOTYPE_VARIANTS = ["A", "B", "C"] as const;

export type ConfigPrototypeVariant = (typeof CONFIG_PROTOTYPE_VARIANTS)[number];

export const CONFIG_PROTOTYPE_VARIANT_LABELS: Record<ConfigPrototypeVariant, string> = {
  A: "A — console tabs · save then apply",
  B: "B — rundown first · live apply",
  C: "C — pre-flight wizard · apply at end"
};

const navigateToVariant = (variant: ConfigPrototypeVariant): void => {
  const url = new URL(window.location.href);
  url.searchParams.set("variant", variant);
  window.location.assign(url.toString());
};

const cycle = (current: ConfigPrototypeVariant, direction: -1 | 1): ConfigPrototypeVariant => {
  const currentIndex = CONFIG_PROTOTYPE_VARIANTS.indexOf(current);
  const nextIndex =
    (currentIndex + direction + CONFIG_PROTOTYPE_VARIANTS.length) %
    CONFIG_PROTOTYPE_VARIANTS.length;
  return CONFIG_PROTOTYPE_VARIANTS[nextIndex];
};

const isEditableTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target.isContentEditable
  );
};

export const VariantSwitcher = (props: { variant: ConfigPrototypeVariant }): JSX.Element => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (isEditableTarget(event.target)) {
        return;
      }

      if (event.key === "ArrowLeft") {
        navigateToVariant(cycle(props.variant, -1));
      }

      if (event.key === "ArrowRight") {
        navigateToVariant(cycle(props.variant, 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return (): void => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [props.variant]);

  return (
    <div className={styles.switcherBar}>
      <button
        type="button"
        className={styles.switcherArrow}
        aria-label="Previous variant"
        onClick={(): void => {
          navigateToVariant(cycle(props.variant, -1));
        }}
      >
        ←
      </button>
      <span className={styles.switcherLabel}>
        {CONFIG_PROTOTYPE_VARIANT_LABELS[props.variant]}
      </span>
      <span className={styles.switcherBadge}>PROTOTYPE</span>
      <button
        type="button"
        className={styles.switcherArrow}
        aria-label="Next variant"
        onClick={(): void => {
          navigateToVariant(cycle(props.variant, 1));
        }}
      >
        →
      </button>
    </div>
  );
};
