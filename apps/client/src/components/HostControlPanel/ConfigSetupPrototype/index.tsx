// PROTOTYPE (throwaway) — config-setup lab. Mounted on /host behind
// ?variant=A|B|C, dev builds only. Real host chrome (viewport grid + CTA bar)
// stays; the 1fr row swaps per variant. Delete the whole folder plus the gate
// in ../index.tsx once a direction is picked (port-variant owns the rewrite).
import { Phase } from "@wingnight/shared";

import { useHostRoomState } from "../../../context/RoomStateContext";
import { HostActionBarSurface } from "../HostActionBarSurface";
import { useConfigDraft } from "./useConfigDraft";
import { VariantA } from "./VariantA";
import { VariantB } from "./VariantB";
import { VariantC } from "./VariantC";
import {
  CONFIG_PROTOTYPE_VARIANTS,
  VariantSwitcher,
  type ConfigPrototypeVariant
} from "./VariantSwitcher";
import * as styles from "./styles";

export const resolveConfigSetupPrototypeVariant = (
  search: string
): ConfigPrototypeVariant | null => {
  if (!import.meta.env.DEV) {
    return null;
  }

  const raw = new URLSearchParams(search).get("variant")?.toUpperCase() ?? null;
  return CONFIG_PROTOTYPE_VARIANTS.find((variant) => variant === raw) ?? null;
};

export const ConfigSetupPrototypeLab = (props: {
  variant: ConfigPrototypeVariant;
}): JSX.Element => {
  const roomState = useHostRoomState();
  const configDraft = useConfigDraft({ autoApply: props.variant === "B" });
  // Lock mirrors the live room (config locks once the night starts); ?locked=0|1
  // overrides it so both states can be evaluated without touching the room.
  const lockedOverride = new URLSearchParams(window.location.search).get("locked");
  const isLocked =
    lockedOverride !== null
      ? lockedOverride === "1"
      : roomState !== null && roomState.phase !== Phase.SETUP;

  return (
    <main className={styles.container}>
      {props.variant === "A" && <VariantA configDraft={configDraft} isLocked={isLocked} />}
      {props.variant === "B" && <VariantB configDraft={configDraft} isLocked={isLocked} />}
      {props.variant === "C" && <VariantC configDraft={configDraft} isLocked={isLocked} />}

      <HostActionBarSurface nextPhaseDisabled primaryButtonLabel="Start the night" />

      <VariantSwitcher variant={props.variant} />
    </main>
  );
};
