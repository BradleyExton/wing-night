import { memo } from "react";
import {
  CHARACTER_FOOT,
  CHARACTER_STAND_HEIGHT,
  CharacterFigure,
  resolvePlayerAppearance,
  type CharacterAppearance
} from "@wingnight/cast";

import { runGunLabCopy } from "../../copy";
import { resolveSlotColour, yardNight } from "../../palette";
import {
  YARD,
  isHenDown,
  isHenDucking,
  isTurretOut,
  resolveHenHeight,
  resolveHenPose,
  resolveTurretHeight,
  resolveTurretX,
  type HenPoseName,
  type YardHen,
  type YardTurret,
  type YardWorld
} from "../../yardSim";
import * as styles from "./styles";

const copy = runGunLabCopy.yard;

const HEN_SCALE = YARD.henHeight / CHARACTER_STAND_HEIGHT;
const HEN_FIGURE_TRANSFORM = `translate(${-CHARACTER_FOOT.x} ${-CHARACTER_FOOT.y})`;
// The cast has no duck. Until it does, a ducking hen is the standing one pressed flat.
const DUCK_SQUASH = YARD.duckHeight / YARD.henHeight;

// No roster in a lab: a bird per slot, shaped by a made-up name the way a real one is by its own.
const APPEARANCES: CharacterAppearance[] = ["Ash", "Birdie", "Clem", "Dot", "Echo", "Fig"].map((name) =>
  resolvePlayerAppearance({ name })
);

const round = (value: number): number => Math.round(value * 100) / 100;

// Re-rendered only when the pose changes, so the walk cycle's own CSS runs undisturbed between.
const HenArt = memo(({ slot, pose }: { slot: number; pose: HenPoseName }): JSX.Element => (
  <g transform={HEN_FIGURE_TRANSFORM}>
    <CharacterFigure appearance={APPEARANCES[slot % APPEARANCES.length] ?? { body: "round", comb: "crest", tail: "fan", dance: "bounce" }} pose={pose} />
  </g>
));

HenArt.displayName = "HenArt";

type HenProps = { hen: YardHen; tick: number; forgiveness: number; showBoxes: boolean };

const Hen = ({ hen, tick, forgiveness, showBoxes }: HenProps): JSX.Element => {
  const colour = resolveSlotColour(hen.slot);
  const feetY = YARD.groundY - hen.lift;
  const down = isHenDown(hen, tick);
  const ducking = isHenDucking(hen, tick);
  const flicker = !down && tick < hen.invulnerableUntil && Math.floor(tick / 4) % 2 === 1;
  const height = resolveHenHeight(hen, tick);
  const reach = Math.max(0.5, YARD.henHalfWidth - forgiveness);

  return (
    <g
      data-proto-hen={hen.padId}
      data-proto-x={round(hen.x)}
      data-proto-lift={round(hen.lift)}
      data-proto-ducking={ducking ? "true" : "false"}
    >
      <ellipse cx={round(hen.x)} cy={YARD.groundY + 0.4} rx={6.5} ry={1.5} fill={yardNight.shadow} opacity={0.45} />
      <ellipse cx={round(hen.x)} cy={YARD.groundY + 0.4} rx={7.6} ry={2} fill="none" stroke={colour} strokeWidth={0.7} />
      <g
        className={styles.henFill}
        opacity={flicker ? 0.35 : 1}
        transform={`translate(${round(hen.x)} ${round(feetY)}) scale(${hen.facing * HEN_SCALE} ${round(HEN_SCALE * (ducking ? DUCK_SQUASH : 1))})`}
      >
        <HenArt slot={hen.slot} pose={resolveHenPose(hen, tick)} />
      </g>
      {showBoxes && !down && (
        <rect
          x={round(hen.x - reach)}
          y={round(feetY - height + forgiveness)}
          width={round(reach * 2)}
          height={round(Math.max(0, height - forgiveness * 2))}
          fill="none"
          stroke={yardNight.box}
          strokeWidth={0.3}
          strokeDasharray="1.2 1"
        />
      )}
      <text className={styles.tag} x={round(hen.x)} y={round(feetY - YARD.henHeight - 9)} textAnchor="middle" fill={colour}>
        {copy.playerTag(hen.slot)}
      </text>
    </g>
  );
};

type TurretProps = { turret: YardTurret; tick: number; isFlashing: boolean };

const Turret = ({ turret, tick, isFlashing }: TurretProps): JSX.Element => {
  const x = resolveTurretX(turret);
  const y = YARD.groundY - resolveTurretHeight(turret);
  const out = isTurretOut(turret, tick);
  const throb = isFlashing && Math.floor(tick / 5) % 2 === 0;
  const barrel = out ? yardNight.out : isFlashing ? yardNight.alarm : yardNight.barrel;

  return (
    <g data-proto-turret={turret.id} data-proto-turret-out={out ? "true" : "false"} opacity={out ? 0.5 : 1}>
      <rect x={round(x - 3)} y={round(y - 3)} width={6} height={6} rx={1} fill={yardNight.wallDark} />
      <rect x={round(turret.side === 1 ? x - 8 : x + 2)} y={round(y - 1.2)} width={6} height={2.4} rx={0.6} fill={barrel} />
      <text
        className={styles.hint}
        x={round(x - turret.side * 16)}
        y={round(y + 1.4)}
        textAnchor="middle"
        fill={yardNight.barrel}
        opacity={0.55}
      >
        {turret.level === "low" ? copy.lowHint : copy.highHint}
      </text>
      {isFlashing && (
        <text
          className={styles.alarm}
          x={round(x - turret.side * 9)}
          y={round(y - 4)}
          textAnchor="middle"
          fill={yardNight.alarm}
          opacity={throb ? 1 : 0.6}
        >
          {copy.alarm}
        </text>
      )}
    </g>
  );
};

type SceneProps = {
  world: YardWorld;
  /** The world is mutated in place; this is what tells React a frame went by. */
  frame: number;
  forgiveness: number;
  showBoxes: boolean;
};

const HANGAR_RIBS = [28, 52, 76, 100, 124];

/** The yard: a wall of two turrets at each end, a floor, and whoever is on it. */
export const Scene = ({ world, frame, forgiveness, showBoxes }: SceneProps): JSX.Element => (
  <svg
    className={styles.scene}
    viewBox={`0 0 ${YARD.width} ${YARD.height}`}
    preserveAspectRatio="xMidYMid meet"
    data-proto-frame={frame}
    data-proto-tick={world.tick}
  >
    <rect width={YARD.width} height={YARD.height} fill={yardNight.sky} />
    <path d={`M 14 ${YARD.groundY} V 34 Q 80 6 146 34 V ${YARD.groundY} Z`} fill={yardNight.hangar} />
    {HANGAR_RIBS.map((x) => (
      <path key={x} d={`M ${x} ${YARD.groundY} V 26`} stroke={yardNight.hangarLine} strokeWidth={0.6} />
    ))}
    <rect x={0} y={YARD.groundY - 26} width={YARD.wallInset + 3} height={26} fill={yardNight.wall} />
    <rect x={YARD.width - YARD.wallInset - 3} y={YARD.groundY - 26} width={YARD.wallInset + 3} height={26} fill={yardNight.wall} />
    <rect y={YARD.groundY} width={YARD.width} height={YARD.height - YARD.groundY} fill={yardNight.ground} />
    <rect y={YARD.groundY} width={YARD.width} height={0.8} fill={yardNight.groundLine} />
    {world.turrets.map((turret) => (
      <Turret key={turret.id} turret={turret} tick={world.tick} isFlashing={world.telegraph?.turretId === turret.id} />
    ))}
    {world.hens.map((hen) => (
      <Hen key={hen.padId} hen={hen} tick={world.tick} forgiveness={forgiveness} showBoxes={showBoxes} />
    ))}
    {world.sauce.map((drop) => (
      <circle key={drop.id} cx={round(drop.x)} cy={round(drop.y)} r={0.8} fill={yardNight.sauce} />
    ))}
    {world.shots.map((shot) => (
      <g key={shot.id} data-proto-shot={shot.id}>
        <circle cx={round(shot.x)} cy={round(shot.y)} r={YARD.shotRadius} fill={yardNight.shot} />
        {showBoxes && (
          <rect
            x={round(shot.x - YARD.shotRadius)}
            y={round(shot.y - YARD.shotRadius)}
            width={YARD.shotRadius * 2}
            height={YARD.shotRadius * 2}
            fill="none"
            stroke={yardNight.box}
            strokeWidth={0.3}
          />
        )}
      </g>
    ))}
  </svg>
);
