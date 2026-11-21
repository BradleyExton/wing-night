import { GOOSE_ART_HEIGHT, GooseFigure, brawlGoonPalette } from "@wingnight/minigames-brawl/client";
import { BORDEN_WORLD, resolveBordenFoeBox, type BordenFoe } from "@wingnight/shared";

import { bordenSceneCopy as copy } from "../copy.js";
import { BORDEN_GROUND_Y, round2, toScreenY } from "../frameGeometry.js";
import { bordenNight as ink } from "../palette.js";

const FOES = BORDEN_WORLD.foes;

export type FoeProps = {
  foe: BordenFoe;
  tick: number;
  /** Flashing now: it fires when the flash runs out. */
  isFlashing: boolean;
  /** Which way along the stretch the nearest hen is from it: where its barrel points. */
  aim: -1 | 1;
  /** Ink for the "!" over a flashing shooter. */
  alarmClassName: string;
};

/** A foe sprayed down tips over and fades for as long as the sim keeps it. */
const resolveKo = (foe: BordenFoe, tick: number): { opacity: number; tilt: number } => {
  if (foe.koTick === null) {
    return { opacity: 1, tilt: 0 };
  }

  const share = Math.min(1, (tick - foe.koTick) / BORDEN_WORLD.koLingerTicks);

  return { opacity: round2(1 - share * 0.8), tilt: round2(share * 70) };
};

/** The "!" over a shooter about to fire, throbbing, and the level it will fire at. */
const Alarm = ({ x, y, tick, className }: { x: number; y: number; tick: number; className: string }): JSX.Element => (
  <text className={className} x={round2(x)} y={round2(y)} textAnchor="middle" fill={ink.alarm} opacity={Math.floor(tick / 5) % 2 === 0 ? 1 : 0.55}>
    {copy.alarm}
  </text>
);

/** A sentry turret on its post: a box at its level, a barrel toward the hens. */
const Turret = ({ foe, tick, isFlashing, aim, alarmClassName }: FoeProps): JSX.Element => {
  const box = resolveBordenFoeBox(foe);
  const half = FOES.turret.halfWidth;
  const top = toScreenY(box.top);
  const bottom = toScreenY(box.bottom);
  const mid = toScreenY((box.top + box.bottom) / 2);

  return (
    <g>
      <rect x={foe.x - 0.8} y={bottom} width={1.6} height={round2(BORDEN_GROUND_Y - bottom)} fill={ink.steel} />
      <rect x={foe.x - half} y={top} width={half * 2} height={round2(bottom - top)} rx={1.2} fill={ink.steelDark} stroke={ink.steel} strokeWidth={0.4} />
      <circle cx={foe.x} cy={mid} r={1.4} fill={isFlashing ? ink.alarm : ink.window} />
      <rect x={aim === 1 ? foe.x + half - 0.5 : foe.x - half - 4.5} y={mid - 0.9} width={5} height={1.8} rx={0.5} fill={isFlashing ? ink.alarm : ink.steel} />
      {isFlashing && <Alarm x={foe.x} y={top - 2} tick={tick} className={alarmClassName} />}
    </g>
  );
};

/** The tank: treads, hull, a dome and a low barrel for its one slow shell. Its treads turn while it rolls. */
const Tank = ({ foe, tick, isFlashing, aim, alarmClassName }: FoeProps): JSX.Element => {
  const half = FOES.tank.halfWidth;
  const height = FOES.tank.height;
  const roll = foe.parked ? 0 : Math.floor(tick / 4) % 2;

  return (
    <g>
      <rect x={foe.x - half} y={toScreenY(4)} width={half * 2} height={4} rx={2} fill={ink.steelDark} />
      {[-7, -2.5, 2, 6.5].map((dx) => (
        <circle key={dx} cx={foe.x + dx + roll} cy={toScreenY(2)} r={1.4} fill={ink.steel} />
      ))}
      <path d={`M ${foe.x - half} ${toScreenY(4)} L ${foe.x - half + 2} ${toScreenY(9)} H ${foe.x + half - 2} L ${foe.x + half} ${toScreenY(4)} Z`} fill={ink.olive} />
      <path d={`M ${foe.x - 5} ${toScreenY(9)} Q ${foe.x} ${toScreenY(height + 1)} ${foe.x + 5} ${toScreenY(9)} Z`} fill={ink.oliveDark} />
      <rect
        x={aim === 1 ? foe.x + half - 3 : foe.x - half - 6}
        y={toScreenY(BORDEN_WORLD.lowShotHeight + 1.2)}
        width={9}
        height={2.4}
        rx={0.6}
        fill={isFlashing ? ink.alarm : ink.steel}
      />
      {isFlashing && <Alarm x={foe.x} y={toScreenY(height + 3)} tick={tick} className={alarmClassName} />}
    </g>
  );
};

const gooseTransform = (x: number, height: number, facing: -1 | 1): string => {
  const scale = round2(height / GOOSE_ART_HEIGHT);

  return `translate(${round2(x)} ${BORDEN_GROUND_Y}) scale(${facing * scale} ${scale})`;
};

/** The motor-pool goose: Barrie's goose, running in at a hen. One peck of sauce takes it down. */
const Goose = ({ foe, tick }: FoeProps): JSX.Element => (
  <g transform={gooseTransform(foe.x, FOES.goose.height, foe.vx > 0 ? 1 : -1)}>
    <GooseFigure state={foe.koTick === null ? "approach" : "ko"} tick={tick} palette={brawlGoonPalette} variant="goose" />
  </g>
);

/**
 * The drill sergeant at the last gate: the biggest goose on the base, with a megaphone whose
 * shouts are the shots. The megaphone tips to the level of the shout coming next.
 */
const Sergeant = ({ foe, tick, isFlashing, aim, alarmClassName }: FoeProps): JSX.Element => {
  const height = FOES.sergeant.height;
  const mouthY = toScreenY(foe.level === "low" ? BORDEN_WORLD.lowShotHeight + 6 : BORDEN_WORLD.highShotHeight + 4);
  const fromX = foe.x + aim * 4;
  const toX = foe.x + aim * (FOES.sergeant.halfWidth + 1);
  const headY = toScreenY(height * 0.72);

  return (
    <g>
      <g transform={gooseTransform(foe.x, height, aim)}>
        <GooseFigure
          state={foe.koTick !== null ? "ko" : isFlashing ? "telegraph" : "stalk"}
          tick={tick}
          palette={brawlGoonPalette}
          variant="boss"
        />
      </g>
      {foe.koTick === null && (
        <path
          d={`M ${fromX} ${headY} L ${toX} ${round2(mouthY - 2.4)} L ${toX} ${round2(mouthY + 2.4)} Z`}
          fill={isFlashing ? ink.alarm : ink.gate}
          stroke={ink.inkDark}
          strokeWidth={0.3}
        />
      )}
      {isFlashing && <Alarm x={foe.x} y={toScreenY(height + 3)} tick={tick} className={alarmClassName} />}
    </g>
  );
};

const DRAWINGS = { turret: Turret, tank: Tank, goose: Goose, sergeant: Sergeant } as const;

/** One foe in world units, with the harness's seams on it. */
export const Foe = (props: FoeProps): JSX.Element => {
  const { foe, tick } = props;
  const Drawing = DRAWINGS[foe.kind];
  const ko = resolveKo(foe, tick);
  const isGoose = foe.kind === "goose" || foe.kind === "sergeant";

  return (
    <g
      data-borden-foe={foe.id}
      data-borden-foe-kind={foe.kind}
      data-borden-foe-state={foe.koTick === null ? (props.isFlashing ? "flashing" : "live") : "ko"}
      data-borden-x={round2(foe.x)}
      opacity={ko.opacity}
      transform={isGoose || ko.tilt === 0 ? undefined : `rotate(${ko.tilt * -props.aim} ${round2(foe.x)} ${BORDEN_GROUND_Y})`}
    >
      <Drawing {...props} />
    </g>
  );
};
