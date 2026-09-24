import type { JoustShooterView } from "@wingnight/shared";
import { resolveSchlongPaths } from "@wingnight/cast";

import { loadoutCopy } from "./copy.js";
import * as styles from "./styles.js";

export type LoadoutProps = {
  shooters: readonly JoustShooterView[];
  selectedShooterId: string;
  // Whether a tap may change what is on the band: only while the team is aiming, and only
  // when this tablet may dispatch at all.
  canPick: boolean;
  onPick: (shooterId: string) => void;
};

// The icon is the kind itself, drawn by the same function that draws it on the band: a
// straight spine five links long at the kind's own spacing, capped with its own head — so a Log
// is visibly longer and fatter than a Pencil before either has flown, and the row reads by
// silhouette before it reads by colour.
const ICON_WIDTH = 40;
const ICON_HEIGHT = 24;
const ICON_TAIL_X = 4;
const ICON_LINKS = 5;

const KindIcon = ({ kind }: { kind: JoustShooterView }): JSX.Element => {
  const { profile, color } = kind;
  const length = profile.linkSpacing * ICON_LINKS;
  // Scale the longest kind to the box, so every icon shares one scale and the lengths compare.
  const scale = Math.min(1, (ICON_WIDTH - ICON_TAIL_X - profile.headRadius) / (length + profile.headRadius));
  const y = ICON_HEIGHT / 2;
  const spine = Array.from({ length: ICON_LINKS + 1 }, (_unused, index) => ({
    x: ICON_TAIL_X + index * profile.linkSpacing * scale,
    y
  }));
  const paths = resolveSchlongPaths(spine, {
    shaftRadius: profile.shaftRadius * scale,
    headRadius: profile.headRadius * scale
  });

  return (
    <svg
      className={styles.icon}
      viewBox={`0 0 ${ICON_WIDTH} ${ICON_HEIGHT}`}
      aria-hidden="true"
      data-joust-loadout-icon={kind.id}
    >
      <path d={paths.body} fill={color.fill} stroke={color.dark} strokeWidth={0.8} strokeLinejoin="round" />
      <path d={paths.gloss} fill={color.light} opacity={0.62} />
      <path d={paths.corona} fill="none" stroke={color.dark} strokeWidth={0.55} strokeLinecap="round" />
    </svg>
  );
};

/**
 * The strategy layer on the tablet: a row of the turn's kinds, the loaded one ringed, the
 * spent ones dimmed and dead. Hidden when the pack authors one kind or none — a choice with one
 * option is chrome.
 */
export const Loadout = ({
  shooters,
  selectedShooterId,
  canPick,
  onPick
}: LoadoutProps): JSX.Element | null => {
  if (shooters.length < 2) {
    return null;
  }

  return (
    <div className={styles.dock} role="group" aria-label={loadoutCopy.label} data-joust-loadout>
      <span className={styles.label}>{loadoutCopy.label}</span>
      {shooters.map((kind) => {
        const isSelected = kind.id === selectedShooterId;
        const isSpent = kind.usesLeft !== null && kind.usesLeft <= 0;
        const usesLabel =
          kind.usesLeft === null
            ? loadoutCopy.unlimitedLabel
            : isSpent
              ? loadoutCopy.spentLabel
              : loadoutCopy.usesLeftLabel(kind.usesLeft);

        return (
          <button
            key={kind.id}
            type="button"
            className={isSpent ? styles.kindSpent : isSelected ? styles.kindSelected : styles.kind}
            disabled={isSpent || !canPick}
            aria-pressed={isSelected}
            aria-label={loadoutCopy.pickLabel(kind.name, kind.blurb)}
            title={kind.blurb}
            data-joust-loadout-kind={kind.id}
            data-joust-loadout-selected={isSelected ? "true" : undefined}
            data-joust-loadout-spent={isSpent ? "true" : undefined}
            onClick={(): void => {
              onPick(kind.id);
            }}
          >
            <KindIcon kind={kind} />
            <span className={styles.name}>{kind.name}</span>
            <span className={isSelected ? styles.usesSelected : styles.uses}>{usesLabel}</span>
          </button>
        );
      })}
    </div>
  );
};
