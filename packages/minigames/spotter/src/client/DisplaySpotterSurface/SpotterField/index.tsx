import type { SpotterMinigameDisplayView, SpotterShotResult } from "@wingnight/shared";

import { displaySpotterSurfaceCopy } from "../copy.js";
import { resolveTrailCells } from "../../resolveTrailCells/index.js";
import * as styles from "./styles.js";

// Cells are rendered in a fixed unit space and the SVG scales to fit, so the
// same normalized field reads identically at 720p and 4K.
const CELL = 100;
const TARGET_RADIUS = 36;
const SPLAT_RADIUS = 30;
const CROSSHAIR_RADIUS = 34;
const CROSSHAIR_ARM = 52;

type SpotterFieldProps = {
  view: SpotterMinigameDisplayView;
};

const centreX = (col: number): number => col * CELL + CELL / 2;

const centreY = (row: number): number => row * CELL + CELL / 2;

const resolveSplatClassName = (band: SpotterShotResult["band"]): string => {
  if (band === "HIT") {
    return styles.splatHit;
  }

  if (band === "CLOSE") {
    return styles.splatClose;
  }

  return styles.splatMiss;
};

export const SpotterField = ({ view }: SpotterFieldProps): JSX.Element => {
  const width = view.gridCols * CELL;
  const height = view.gridRows * CELL;
  const trailCells = resolveTrailCells(view.cursor, view.path);
  const trailPoints = trailCells
    .map((cell) => `${centreX(cell.col)},${centreY(cell.row)}`)
    .join(" ");
  const trailStart = trailCells[0];

  return (
    <svg
      className={styles.svg}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={displaySpotterSurfaceCopy.fieldLabel}
      data-spotter-field
    >
      {Array.from({ length: view.gridCols + 1 }, (_, index) => (
        <line
          key={`col-${index}`}
          className={styles.gridLine}
          x1={index * CELL}
          y1={0}
          x2={index * CELL}
          y2={height}
          strokeWidth={2}
        />
      ))}
      {Array.from({ length: view.gridRows + 1 }, (_, index) => (
        <line
          key={`row-${index}`}
          className={styles.gridLine}
          x1={0}
          y1={index * CELL}
          x2={width}
          y2={index * CELL}
          strokeWidth={2}
        />
      ))}
      {view.targets.map((target, index) => {
        const isCurrent = index === view.targetIndex;
        const isResolved = index < view.targetIndex;
        const x = centreX(target.col);
        const y = centreY(target.row);

        return (
          <g key={`target-${index}`} data-spotter-target={index}>
            <circle
              className={
                isCurrent
                  ? styles.targetCurrent
                  : isResolved
                    ? styles.targetResolved
                    : styles.targetUpcoming
              }
              cx={x}
              cy={y}
              r={TARGET_RADIUS}
              strokeWidth={isCurrent ? 8 : 4}
            />
            {!isResolved && (
              <text
                className={isCurrent ? styles.targetCurrentLabel : styles.targetUpcomingLabel}
                x={x}
                y={y}
                fontSize={isCurrent ? 44 : 34}
                textAnchor="middle"
                dominantBaseline="central"
              >
                {index + 1}
              </text>
            )}
          </g>
        );
      })}
      {view.results.map((result) => (
        <g key={`shot-${result.targetIndex}`} data-spotter-shot={result.band}>
          <circle
            className={resolveSplatClassName(result.band)}
            cx={centreX(result.col)}
            cy={centreY(result.row)}
            r={SPLAT_RADIUS}
          />
          <text
            className={styles.splatLabel}
            x={centreX(result.col)}
            y={centreY(result.row)}
            fontSize={22}
            textAnchor="middle"
            dominantBaseline="central"
          >
            {displaySpotterSurfaceCopy.shotLabel(result.band, result.points)}
          </text>
        </g>
      ))}
      {trailCells.length > 1 && trailStart !== undefined && (
        <>
          <polyline
            className={styles.trail}
            points={trailPoints}
            strokeWidth={10}
            strokeLinecap="round"
            strokeLinejoin="round"
            data-spotter-trail={trailCells.length}
          />
          <circle
            className={styles.trailStart}
            cx={centreX(trailStart.col)}
            cy={centreY(trailStart.row)}
            r={12}
          />
        </>
      )}
      <g data-spotter-crosshair>
        <circle
          className={styles.crosshairRing}
          cx={centreX(view.cursor.col)}
          cy={centreY(view.cursor.row)}
          r={CROSSHAIR_RADIUS}
          strokeWidth={8}
        />
        <line
          className={styles.crosshairLine}
          x1={centreX(view.cursor.col) - CROSSHAIR_ARM}
          y1={centreY(view.cursor.row)}
          x2={centreX(view.cursor.col) + CROSSHAIR_ARM}
          y2={centreY(view.cursor.row)}
          strokeWidth={8}
          strokeLinecap="round"
        />
        <line
          className={styles.crosshairLine}
          x1={centreX(view.cursor.col)}
          y1={centreY(view.cursor.row) - CROSSHAIR_ARM}
          x2={centreX(view.cursor.col)}
          y2={centreY(view.cursor.row) + CROSSHAIR_ARM}
          strokeWidth={8}
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
};
