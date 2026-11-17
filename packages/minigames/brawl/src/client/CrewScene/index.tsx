import { memo } from "react";
import { CharacterFigure, type CharacterPose } from "@wingnight/cast";
import {
  BRAWL_CREW_WORLD,
  isBrawlCrewHenPecking,
  type BrawlCrewBlock,
  type BrawlCrewFrame,
  type BrawlCrewGoon,
  type BrawlCrewHen,
  type BrawlCrewMember
} from "@wingnight/shared";

import { Goon, brawlGoonPalette } from "../BrawlScene/Goons/index.js";
import { HEN_FIGURE_TRANSFORM, HEN_SCALE } from "../BrawlScene/henPose/index.js";
import { resolveHenFigure, type HenFigure } from "../resolveHenFigure/index.js";
import { crewSceneCopy } from "./copy.js";
import { crewNight, resolveCrewSlotColour } from "./palette.js";
import * as styles from "./styles.js";

const WORLD = BRAWL_CREW_WORLD;

/** Screen y of the back of the walkable band; a figure at depth `z` stands at `BAND_BACK_Y + z`. */
const BAND_BACK_Y = 70;

/** The goon drawings stand on the relay's ground line (`BRAWL_WORLD.groundY`), which is the band's back. */
const GOON_GROUND_Y = WORLD.groundY;

const round = (value: number): number => Math.round(value * 100) / 100;

const resolveGroundY = (z: number): number => BAND_BACK_Y + z;

const resolvePose = (hen: BrawlCrewHen, tick: number): CharacterPose => {
  if (hen.state === "down") {
    return "ko";
  }

  if (hen.state === "away") {
    return "still";
  }

  if (tick < hen.hurtUntilTick) {
    return "hurt";
  }

  if (isBrawlCrewHenPecking(hen, tick)) {
    return "peck";
  }

  return hen.walk === 0 ? "idle" : "walk";
};

// Re-rendered only when her pose changes, so a walk cycle's own CSS runs undisturbed between.
const HenArt = memo(({ figure, pose }: { figure: HenFigure; pose: CharacterPose }): JSX.Element => (
  <g transform={HEN_FIGURE_TRANSFORM}>
    <CharacterFigure appearance={figure.appearance} apparel={figure.apparel} silhouette={figure.silhouette} pose={pose} />
  </g>
));

HenArt.displayName = "HenArt";

/** How far in from the window's edges a hen's name is kept, so it is never cut off at one. */
const TAG_MARGIN = 16;

type HenProps = { hen: BrawlCrewHen; figure: HenFigure; tick: number; cameraX: number };

const Hen = ({ hen, figure, tick, cameraX }: HenProps): JSX.Element => {
  const colour = resolveCrewSlotColour(hen.slot);
  const groundY = resolveGroundY(hen.z);
  const isFlicker = hen.state === "up" && tick < hen.invulnerableUntilTick && Math.floor(tick / 4) % 2 === 1;
  const revive =
    hen.state === "down" && hen.reviveSinceTick !== null
      ? Math.min(1, (tick - hen.reviveSinceTick) / WORLD.reviveTicks)
      : 0;

  return (
    <g data-brawl-hen={hen.slot} data-brawl-hen-state={hen.state} data-brawl-x={round(hen.x)} data-brawl-z={round(hen.z)}>
      <ellipse cx={round(hen.x)} cy={round(groundY + 0.4)} rx={6.5} ry={1.5} fill={crewNight.shadow} opacity={0.45} />
      <ellipse cx={round(hen.x)} cy={round(groundY + 0.4)} rx={7.8} ry={2.1} fill="none" stroke={colour} strokeWidth={0.8} />
      {revive > 0 && (
        // The count over a downed hen: a ring closing round her as a teammate stands there.
        <circle
          cx={round(hen.x)}
          cy={round(groundY - 6)}
          r={10}
          fill="none"
          stroke={crewNight.revive}
          strokeWidth={1.4}
          strokeDasharray={`${round(revive * 62.8)} 62.8`}
          transform={`rotate(-90 ${round(hen.x)} ${round(groundY - 6)})`}
        />
      )}
      <g
        className={figure.fillClassName}
        opacity={hen.state === "away" ? 0.4 : isFlicker ? 0.35 : 1}
        transform={`translate(${round(hen.x)} ${round(groundY)}) scale(${hen.facing * HEN_SCALE} ${HEN_SCALE})`}
      >
        <HenArt figure={figure} pose={resolvePose(hen, tick)} />
      </g>
      <text
        className={styles.tag}
        x={round(Math.max(cameraX + TAG_MARGIN, Math.min(cameraX + WORLD.width - TAG_MARGIN, hen.x)))}
        y={round(groundY - WORLD.henHeight - 9)}
        textAnchor="middle"
        fill={colour}
      >
        {crewSceneCopy.tag(figure.playerName, hen.slot, hen.state)}
      </text>
    </g>
  );
};

const GoonFigure = ({ goon, tick }: { goon: BrawlCrewGoon; tick: number }): JSX.Element => {
  const groundY = resolveGroundY(goon.z);

  return (
    <g data-brawl-goon={goon.spawnIndex}>
      {/* Its shadow is on its line whatever height it is at: a flier nobody can place is unfair. */}
      <ellipse cx={round(goon.x)} cy={round(groundY + 0.4)} rx={6} ry={1.4} fill={crewNight.shadow} opacity={0.4} />
      <g transform={`translate(0 ${round(groundY - GOON_GROUND_Y)})`}>
        <Goon kind={goon.kind} x={goon.x} y={goon.y} facing={goon.facing} state={goon.state} tick={tick} palette={brawlGoonPalette} />
      </g>
    </g>
  );
};

const WINDOWS = [14, 44, 74, 104, 134, 164];

type CrewSceneProps = {
  frame: BrawlCrewFrame;
  layout: BrawlCrewBlock;
  crew: readonly BrawlCrewMember[];
  activeTurnTeamId: string | null;
  serverOrigin: string | null;
  label: string;
  /**
   * How the 16:9 window sits in a box of another shape. `cover` fills a wider box and gives up
   * sky from the top, never street from the bottom (the wall's arena). `contain` shows the whole
   * window in a narrower one, so no hen is ever off the side of it (the tablet).
   */
  fit: "cover" | "contain";
};

/**
 * The street with depth, as a screen draws one frame of it: an INTERIM scene (spec §0.8 step 4
 * replaces it) that is honest about everything the sim knows — every hen in her player's own
 * head and her slot's ring, every goon in the relay's own drawing on its own line, the hazard,
 * the wing, the way out — on a plain night street. Figures are drawn back to front by depth, each
 * on a shadow at its own foot, which is the only depth cue a flat brawler gets.
 */
export const CrewScene = ({ frame, layout, crew, activeTurnTeamId, serverOrigin, label, fit }: CrewSceneProps): JSX.Element => {
  const figures = [
    ...frame.hens.map((hen) => ({ key: `hen-${hen.slot}`, z: hen.z, hen, goon: null })),
    ...frame.goons.map((goon) => ({ key: `goon-${goon.spawnIndex}`, z: goon.z, hen: null, goon }))
  ].sort((a, b) => a.z - b.z);
  const cameraX = round(frame.cameraX);
  const isWalkingOn = !frame.cameraLocked && frame.outcome === null;

  return (
    <svg
      className={styles.scene}
      viewBox={`0 0 ${WORLD.width} ${WORLD.height}`}
      preserveAspectRatio={fit === "cover" ? "xMidYMax slice" : "xMidYMax meet"}
      role="img"
      aria-label={label}
      data-brawl-scene=""
      data-brawl-tick={frame.tick}
      data-brawl-wave={frame.waveIndex}
      data-brawl-banked={frame.banked}
      data-brawl-outcome={frame.outcome ?? ""}
    >
      <rect width={WORLD.width} height={WORLD.height} fill={crewNight.sky} />
      <g transform={`translate(${round(-cameraX * 0.3)} 0)`}>
        <rect x={-40} y={14} width={WORLD.width * 6} height={10} fill={crewNight.far} />
      </g>
      <g transform={`translate(${-cameraX} 0)`}>
        <rect y={22} width={layout.length} height={BAND_BACK_Y - 26} fill={crewNight.wall} />
        {Array.from({ length: Math.ceil(layout.length / WORLD.width) }, (_unused, screen) =>
          WINDOWS.map((x) => (
            <rect
              key={`${screen}-${x}`}
              x={screen * WORLD.width + x}
              y={32}
              width={9}
              height={12}
              rx={0.8}
              fill={crewNight.pane}
              opacity={0.45}
            />
          ))
        )}
        <rect y={BAND_BACK_Y - 4} width={layout.length} height={2} fill={crewNight.kerb} />
        <rect y={BAND_BACK_Y - 2} width={layout.length} height={WORLD.height - BAND_BACK_Y + 2} fill={crewNight.road} />
        {layout.hazard !== null && (
          <rect
            x={layout.hazard.x}
            y={BAND_BACK_Y - 2}
            width={layout.hazard.width}
            height={WORLD.depth + 4}
            rx={2}
            fill={crewNight.hazard}
            opacity={0.35}
            data-brawl-hazard={layout.hazard.kind}
          />
        )}
        <path
          d={`M ${layout.exitX} ${BAND_BACK_Y - 2} V ${BAND_BACK_Y + WORLD.depth + 2}`}
          stroke={crewNight.exit}
          strokeWidth={0.8}
          strokeDasharray="3 3"
          opacity={0.6}
        />
        {frame.pickups.map((pickup) => (
          <circle key={pickup.untilTick} cx={round(pickup.x)} cy={round(resolveGroundY(pickup.z) - 1.5)} r={2.4} fill={crewNight.wing} data-brawl-wing="" />
        ))}
        {figures.map((figure) =>
          figure.hen !== null ? (
            <Hen
              key={figure.key}
              hen={figure.hen}
              tick={frame.tick}
              cameraX={cameraX}
              figure={resolveHenFigure({ figure: crew[figure.hen.slot]?.player ?? null, activeTurnTeamId, serverOrigin })}
            />
          ) : (
            <GoonFigure key={figure.key} goon={figure.goon} tick={frame.tick} />
          )
        )}
      </g>
      {isWalkingOn && (
        <text className={styles.go} x={WORLD.width - 10} y={34} textAnchor="end" fill={crewNight.ink} data-brawl-go="">
          {crewSceneCopy.go}
        </text>
      )}
    </svg>
  );
};
