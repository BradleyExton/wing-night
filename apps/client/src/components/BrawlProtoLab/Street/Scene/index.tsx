import { memo } from "react";
import {
  CHARACTER_FOOT,
  CHARACTER_STAND_HEIGHT,
  CharacterFigure,
  resolvePlayerAppearance,
  type CharacterAppearance
} from "@wingnight/cast";
import { BRAWL_WORLD } from "@wingnight/shared";

import { brawlProtoLabCopy } from "../../copy";
import { gooseInk, resolveSlotColour, streetNight } from "../../palette";
import {
  STREET,
  isHenDown,
  resolveHenPose,
  type HenPoseName,
  type StreetGoose,
  type StreetHen,
  type StreetWorld
} from "../../streetSim";
import * as styles from "./styles";

const copy = brawlProtoLabCopy.street;

const HEN_SCALE = BRAWL_WORLD.henHeight / CHARACTER_STAND_HEIGHT;
const HEN_FIGURE_TRANSFORM = `translate(${-CHARACTER_FOOT.x} ${-CHARACTER_FOOT.y})`;

// No roster in a lab: a bird per slot, shaped by a made-up name the way a real one is by its own.
const APPEARANCES: CharacterAppearance[] = ["Ash", "Birdie", "Clem", "Dot", "Echo", "Fig"].map((name) =>
  resolvePlayerAppearance({ name })
);

const round = (value: number): number => Math.round(value * 100) / 100;

const resolveGroundY = (z: number): number => STREET.backY + z;

// Re-rendered only when the pose changes, so the walk cycle's own CSS runs undisturbed between.
const HenArt = memo(({ slot, pose }: { slot: number; pose: HenPoseName }): JSX.Element => (
  <g transform={HEN_FIGURE_TRANSFORM}>
    <CharacterFigure appearance={APPEARANCES[slot % APPEARANCES.length] ?? { body: "round", comb: "crest", tail: "fan", dance: "bounce" }} pose={pose} />
  </g>
));

HenArt.displayName = "HenArt";

type HenProps = {
  hen: StreetHen;
  tick: number;
  peckBand: number;
  showReach: boolean;
  teamColours: boolean;
};

const Hen = ({ hen, tick, peckBand, showReach, teamColours }: HenProps): JSX.Element => {
  const colour = resolveSlotColour(hen.slot);
  const groundY = resolveGroundY(hen.z);
  const down = isHenDown(hen, tick);
  const flicker = !down && tick < hen.invulnerableUntil && Math.floor(tick / 4) % 2 === 1;
  const pecking = !down && tick < hen.peckUntil;
  const back = hen.x - hen.facing * BRAWL_WORLD.henRadius;
  const front = hen.x + hen.facing * (BRAWL_WORLD.henRadius + BRAWL_WORLD.peckReach);
  const fill = teamColours ? styles.henFills[0] : styles.henFills[hen.slot % styles.henFills.length];

  return (
    <g data-proto-hen={hen.padId} data-proto-x={round(hen.x)} data-proto-z={round(hen.z)}>
      {showReach && (
        <rect
          x={round(Math.min(back, front))}
          y={round(groundY - peckBand)}
          width={round(Math.abs(front - back))}
          height={round(peckBand * 2)}
          rx={1.5}
          fill={colour}
          opacity={pecking ? 0.45 : 0.14}
        />
      )}
      <ellipse cx={round(hen.x)} cy={round(groundY + 0.4)} rx={6.5} ry={1.5} fill={streetNight.shadow} opacity={0.45} />
      <ellipse
        cx={round(hen.x)}
        cy={round(groundY + 0.4)}
        rx={7.6}
        ry={2}
        fill="none"
        stroke={colour}
        strokeWidth={0.7}
      />
      <g
        className={fill}
        opacity={flicker ? 0.35 : 1}
        transform={`translate(${round(hen.x)} ${round(groundY)}) scale(${hen.facing * HEN_SCALE} ${HEN_SCALE})`}
      >
        <HenArt slot={hen.slot} pose={resolveHenPose(hen, tick)} />
      </g>
      <text
        className={styles.tag}
        x={round(hen.x)}
        y={round(groundY - BRAWL_WORLD.henHeight - 9)}
        textAnchor="middle"
        fill={colour}
      >
        {copy.playerTag(hen.slot)}
      </text>
    </g>
  );
};

const NECK_BY_STATE: Record<StreetGoose["state"], { x: number; y: number }> = {
  enter: { x: 4.6, y: -12.4 },
  approach: { x: 4.6, y: -12.4 },
  telegraph: { x: 1.6, y: -14.6 },
  attack: { x: 9.4, y: -8.6 },
  recover: { x: 5.6, y: -7.4 },
  ko: { x: 4.6, y: -12.4 }
};

const Goose = ({ goose, tick }: { goose: StreetGoose; tick: number }): JSX.Element => {
  const groundY = resolveGroundY(goose.z);
  const head = NECK_BY_STATE[goose.state];
  const walking = goose.state === "approach" || goose.state === "enter";
  const step = walking && Math.floor(tick / 8) % 2 === 0 ? 0.9 : 0;
  const throb = goose.state === "telegraph" && Math.floor(tick / 5) % 2 === 0;

  return (
    <g data-proto-goose={goose.state}>
      <ellipse cx={round(goose.x)} cy={round(groundY + 0.4)} rx={6} ry={1.4} fill={streetNight.shadow} opacity={0.4} />
      <g transform={`translate(${round(goose.x)} ${round(groundY)}) scale(${goose.facing} 1)`}>
        <g transform={goose.state === "ko" ? "rotate(-88 0 -3)" : undefined} opacity={goose.state === "ko" ? 0.55 : 1}>
          <path
            d={`M -1 -3.6 L ${-1 - step} 0 M 1.6 -3.6 L ${1.6 + step} 0`}
            stroke={gooseInk.neck}
            strokeWidth={0.9}
            strokeLinecap="round"
            fill="none"
          />
          <ellipse cx={0} cy={-6} rx={5.2} ry={3.4} fill={gooseInk.body} />
          <path d="M -5 -6.4 Q -1 -9.6 3.4 -7.4 Q 0 -5.6 -5 -6.4 Z" fill={gooseInk.back} />
          <path
            d={`M 3.2 -7 Q ${round((3.2 + head.x) / 2 - 1.4)} ${round((head.y - 7) / 2 - 1)} ${head.x} ${head.y}`}
            stroke={gooseInk.neck}
            strokeWidth={1.7}
            strokeLinecap="round"
            fill="none"
          />
          <circle cx={head.x} cy={head.y} r={1.6} fill={gooseInk.neck} />
          <path d={`M ${head.x - 0.9} ${head.y + 0.5} q 0.9 1 1.8 0 z`} fill={gooseInk.chin} />
          <path d={`M ${head.x + 1.2} ${head.y - 0.6} l 2.6 0.6 l -2.6 0.7 z`} fill={gooseInk.neck} />
        </g>
      </g>
      {goose.state === "telegraph" && (
        <text
          className={styles.honk}
          x={round(goose.x)}
          y={round(groundY - 17)}
          textAnchor="middle"
          fill={gooseInk.alarm}
          opacity={throb ? 1 : 0.6}
        >
          {copy.honk}
        </text>
      )}
    </g>
  );
};

type SceneProps = {
  world: StreetWorld;
  /** The world is mutated in place; this is what tells React a frame went by. */
  frame: number;
  peckBand: number;
  lanes: boolean;
  showReach: boolean;
  teamColours: boolean;
};

const WINDOWS = [14, 30, 46, 70, 86, 110, 126, 146];

/**
 * The street, drawn back to front by depth: a figure nearer the camera overlaps one behind it,
 * and each stands on a shadow at its own foot — the only depth cue a flat brawler gets.
 */
export const Scene = ({ world, frame, peckBand, lanes, showReach, teamColours }: SceneProps): JSX.Element => {
  const figures = [
    ...world.hens.map((hen) => ({ key: `hen-${hen.padId}`, z: hen.z, hen, goose: null })),
    ...world.geese.map((goose) => ({ key: `goose-${goose.id}`, z: goose.z, hen: null, goose }))
  ].sort((a, b) => a.z - b.z);
  const laneGap = STREET.depth / STREET.lanes;

  return (
    <svg
      className={styles.scene}
      viewBox={`0 0 ${STREET.width} ${STREET.height}`}
      preserveAspectRatio="xMidYMid meet"
      data-proto-frame={frame}
    >
      <rect width={STREET.width} height={STREET.height} fill={streetNight.sky} />
      <rect y={18} width={STREET.width} height={STREET.backY - 22} fill={streetNight.wall} />
      <rect y={12} width={52} height={8} fill={streetNight.far} />
      <rect x={96} y={8} width={64} height={12} fill={streetNight.far} />
      {WINDOWS.map((x) => (
        <rect key={x} x={x} y={26} width={7} height={9} rx={0.6} fill={streetNight.pane} opacity={0.5} />
      ))}
      <rect y={STREET.backY - 4} width={STREET.width} height={2} fill={streetNight.kerb} />
      <rect y={STREET.backY - 2} width={STREET.width} height={STREET.height - STREET.backY + 2} fill={streetNight.road} />
      {lanes &&
        [1, 2].map((line) => (
          <path
            key={line}
            d={`M 0 ${round(STREET.backY + laneGap * line)} H ${STREET.width}`}
            stroke={streetNight.lane}
            strokeWidth={0.5}
            strokeDasharray="5 4"
          />
        ))}
      {figures.map((figure) =>
        figure.hen !== null ? (
          <Hen
            key={figure.key}
            hen={figure.hen}
            tick={world.tick}
            peckBand={peckBand}
            showReach={showReach}
            teamColours={teamColours}
          />
        ) : (
          <Goose key={figure.key} goose={figure.goose} tick={world.tick} />
        )
      )}
    </svg>
  );
};
