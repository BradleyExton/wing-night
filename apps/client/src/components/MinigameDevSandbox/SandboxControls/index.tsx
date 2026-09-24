import type { MinigameSurfacePhase } from "@wingnight/minigames-core";
import {
  MINIGAME_TYPES,
  resolveMinigameDefinition,
  resolveMinigameTypeFromSlug,
  type MinigameType
} from "@wingnight/shared";

import { resolveMinigameBriefingContent } from "../../../copy/minigameBriefings";
import { minigameDevSandboxCopy } from "../copy";
import * as styles from "./styles";

type SandboxControlsProps = {
  minigameType: MinigameType;
  phase: MinigameSurfacePhase;
  // Every team in the fixture's turn order, so the sandbox can reach the content each of them
  // would face. JOUST picks its lane by the team's slot, so this is also the map switcher.
  teamOptions: { teamId: string; label: string }[];
  activeTeamId: string | null;
  onMinigameTypeChange: (minigameType: MinigameType) => void;
  onPhaseChange: (phase: MinigameSurfacePhase) => void;
  onActiveTeamChange: (teamId: string) => void;
  onReset: () => void;
  // Arms a short running clock on both previews so the TV's last ten seconds
  // can be judged here. Absent for a host-paced game, which has no clock to
  // run, so the block does not draw.
  onRehearseClock: (() => void) | null;
};

// The option list is derived from MINIGAME_TYPES, and the option value is the
// slug the sandbox route actually takes — so the switcher cannot offer a game
// that has no sandbox, and cannot guess a slug wrong.
const resolveMinigameOptions = (): { slug: string; label: string }[] => {
  return MINIGAME_TYPES.map((minigameType) => {
    const briefing = resolveMinigameBriefingContent(minigameType, null);

    return {
      slug: resolveMinigameDefinition(minigameType).slug,
      label: briefing?.displayName ?? minigameType
    };
  });
};

export const SandboxControls = ({
  minigameType,
  phase,
  teamOptions,
  activeTeamId,
  onMinigameTypeChange,
  onPhaseChange,
  onActiveTeamChange,
  onReset,
  onRehearseClock
}: SandboxControlsProps): JSX.Element => {
  const minigameOptions = resolveMinigameOptions();
  const activeSlug = resolveMinigameDefinition(minigameType).slug;

  return (
    <section className={styles.controlsCard}>
      <div className={styles.controlsGrid}>
        <div className={styles.controlBlock}>
          <label className={styles.controlLabel} htmlFor="minigame-type">
            {minigameDevSandboxCopy.minigameLabel}
          </label>
          <select
            id="minigame-type"
            className={styles.input}
            value={activeSlug}
            onChange={(event): void => {
              const selectedMinigameType = resolveMinigameTypeFromSlug(event.target.value);

              if (selectedMinigameType === null) {
                return;
              }

              onMinigameTypeChange(selectedMinigameType);
            }}
          >
            {minigameOptions.map((option) => {
              return (
                <option key={option.slug} value={option.slug}>
                  {option.label}
                </option>
              );
            })}
          </select>
        </div>

        <div className={styles.controlBlock}>
          <label className={styles.controlLabel} htmlFor="phase">
            {minigameDevSandboxCopy.phaseLabel}
          </label>
          <select
            id="phase"
            className={styles.input}
            value={phase}
            onChange={(event): void => {
              onPhaseChange(event.target.value as MinigameSurfacePhase);
            }}
          >
            <option value="intro">{minigameDevSandboxCopy.introPhaseLabel}</option>
            <option value="play">{minigameDevSandboxCopy.playPhaseLabel}</option>
          </select>
        </div>

        <div className={styles.controlBlock}>
          <label className={styles.controlLabel} htmlFor="active-team">
            {minigameDevSandboxCopy.teamLabel}
          </label>
          <select
            id="active-team"
            className={styles.input}
            value={activeTeamId ?? ""}
            onChange={(event): void => {
              onActiveTeamChange(event.target.value);
            }}
          >
            {teamOptions.map((option) => (
              <option key={option.teamId} value={option.teamId}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.controlBlock}>
          <span className={styles.controlLabel}>
            {minigameDevSandboxCopy.sessionLabel}
          </span>
          <button
            className={styles.resetButton}
            type="button"
            onClick={(): void => {
              onReset();
            }}
          >
            {minigameDevSandboxCopy.resetButtonLabel}
          </button>
        </div>

        {onRehearseClock !== null && (
          <div className={styles.controlBlock}>
            <span className={styles.controlLabel}>
              {minigameDevSandboxCopy.clockLabel}
            </span>
            <button
              className={styles.resetButton}
              type="button"
              onClick={(): void => {
                onRehearseClock();
              }}
            >
              {minigameDevSandboxCopy.rehearseClockButtonLabel}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
