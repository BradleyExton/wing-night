import { useEffect, useMemo, useRef, useState } from "react";

import { VariantArena } from "./VariantArena";
import { VariantCharacterFirst } from "./VariantCharacterFirst";
import { VariantSidestage } from "./VariantSidestage";
import { contraptionUiLabCopy } from "./copy";
import {
  DEFAULT_PROJECTILE_ID,
  PROJECTILES,
  type ProjectileId,
  requiresAngularVelocity,
  resolveProjectileMeta
} from "./projectile";
import type { VariantSceneProps } from "./scene";
import type { RunOutcome } from "./scene/flightPath";
import {
  resolveSequenceDuration,
  resolveSequencePosition,
  resolveVisibleBeats
} from "./sequence";
import * as styles from "./styles";
import {
  DEFAULT_VARIANT_ID,
  VARIANTS,
  type VariantId,
  resolveVariantId,
  resolveVariantMeta
} from "./variants";

const VARIANT_SCENES: Record<VariantId, (props: VariantSceneProps) => JSX.Element> = {
  sidestage: VariantSidestage,
  arena: VariantArena,
  "character-first": VariantCharacterFirst
};

const OUTCOMES: readonly RunOutcome[] = ["landed", "missed"];

export const ContraptionUiLab = (): JSX.Element => {
  // Every one of these starts at a constant so the module renders identically without a DOM — the
  // `?variant=` read happens in an effect below, never at module or render scope.
  const [variantId, setVariantId] = useState<VariantId>(DEFAULT_VARIANT_ID);
  const [projectile, setProjectile] = useState<ProjectileId>(DEFAULT_PROJECTILE_ID);
  const [outcome, setOutcome] = useState<RunOutcome>("missed");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [runToken, setRunToken] = useState(0);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    setVariantId(resolveVariantId(params.get("variant")));
  }, []);

  useEffect(() => {
    startedAtRef.current = null;
    let frame = 0;

    const step = (now: number): void => {
      if (startedAtRef.current === null) {
        startedAtRef.current = now;
      }

      const next = now - startedAtRef.current;

      setElapsedMs(next);

      if (next < resolveSequenceDuration(outcome)) {
        frame = window.requestAnimationFrame(step);
      }
    };

    frame = window.requestAnimationFrame(step);

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [runToken, variantId, outcome, projectile]);

  const selectVariant = (next: VariantId): void => {
    setVariantId(next);

    const url = new URL(window.location.href);

    url.searchParams.set("variant", next);
    window.history.replaceState({}, "", url);
    setRunToken((token) => token + 1);
  };

  const position = useMemo(() => resolveSequencePosition(elapsedMs), [elapsedMs]);
  const visibleBeats = useMemo(() => resolveVisibleBeats(outcome), [outcome]);
  const variantMeta = resolveVariantMeta(variantId);
  const projectileMeta = resolveProjectileMeta(projectile);
  const needsRotation = requiresAngularVelocity(projectile);
  const Scene = VARIANT_SCENES[variantId];

  return (
    <main className={styles.container}>
      <h1 className={styles.heading}>{contraptionUiLabCopy.heading}</h1>
      <p className={styles.description}>{contraptionUiLabCopy.description}</p>

      <div className={styles.stageRow}>
        <div className={styles.stage}>
          <div className={styles.floatingSwitcher}>
            {VARIANTS.map((variant) => (
              <button
                key={variant.id}
                type="button"
                className={
                  variant.id === variantId ? styles.floatingButtonActive : styles.floatingButton
                }
                onClick={() => selectVariant(variant.id)}
              >
                {variant.label}
              </button>
            ))}
          </div>
          <div className={styles.stageInner}>
            <Scene position={position} outcome={outcome} projectile={projectile} />
          </div>
        </div>

        <aside className={styles.sidePanel}>
          <div className={styles.panelBlock}>
            <p className={styles.legend}>{contraptionUiLabCopy.variantLegend}</p>
            <dl className={styles.axisList}>
              <dt className={styles.axisTerm}>{contraptionUiLabCopy.axisLabel.throwerPlacement}</dt>
              <dd>{variantMeta.throwerPlacement}</dd>
              <dt className={styles.axisTerm}>{contraptionUiLabCopy.axisLabel.throwScale}</dt>
              <dd>{variantMeta.throwScale}</dd>
              <dt className={styles.axisTerm}>{contraptionUiLabCopy.axisLabel.targetTreatment}</dt>
              <dd>{variantMeta.targetTreatment}</dd>
            </dl>
          </div>

          <div className={styles.panelBlock}>
            <p className={styles.legend}>{contraptionUiLabCopy.outcomeLegend}</p>
            <div className={styles.buttonRow}>
              {OUTCOMES.map((candidate) => (
                <button
                  key={candidate}
                  type="button"
                  className={candidate === outcome ? styles.buttonActive : styles.button}
                  onClick={() => {
                    setOutcome(candidate);
                    setRunToken((token) => token + 1);
                  }}
                >
                  {contraptionUiLabCopy.outcomeLabel[candidate]}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.panelBlock}>
            <p className={styles.legend}>{contraptionUiLabCopy.beatsLegend}</p>
            <div className={styles.beatList}>
              {visibleBeats.map((beat) => (
                <span
                  key={beat.id}
                  className={beat.id === position.beat.id ? styles.beatChipActive : styles.beatChip}
                >
                  {beat.label}
                </span>
              ))}
            </div>
            <button
              type="button"
              className={styles.button}
              onClick={() => setRunToken((token) => token + 1)}
            >
              {contraptionUiLabCopy.replay}
            </button>
          </div>

          <div className={styles.panelBlock}>
            <p className={styles.legend}>{contraptionUiLabCopy.projectileQuestionHeading}</p>
            <p className={styles.note}>{contraptionUiLabCopy.projectileQuestionIntro}</p>
            <div className={styles.buttonRow}>
              {PROJECTILES.map((candidate) => (
                <button
                  key={candidate.id}
                  type="button"
                  className={candidate.id === projectile ? styles.buttonActive : styles.button}
                  onClick={() => {
                    setProjectile(candidate.id);
                    setRunToken((token) => token + 1);
                  }}
                >
                  {candidate.label}
                </button>
              ))}
            </div>
            <p className={styles.observation}>{projectileMeta.observation}</p>
            <p className={needsRotation ? styles.implicationWarn : styles.implicationOk}>
              {needsRotation
                ? contraptionUiLabCopy.rotationNeeded
                : contraptionUiLabCopy.rotationNotNeeded}
            </p>
            <p className={styles.note}>{contraptionUiLabCopy.pickReminder}</p>
            <p className={styles.note}>{contraptionUiLabCopy.scriptedSceneNote}</p>
          </div>
        </aside>
      </div>
    </main>
  );
};
