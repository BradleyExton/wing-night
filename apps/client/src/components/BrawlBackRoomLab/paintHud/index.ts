import { BRAWL_CREW_WORLD } from "@wingnight/shared";

import { BACK_ROOM, resolveBackRoomClockTicks, type BackRoomRun } from "../backRoom";
import { brawlBackRoomLabCopy } from "../copy";
import { backRoomInk } from "../palette";

// PROTOTYPE — throwaway. Everything drawn over the street, in the window's own 192 × 108 units:
// the wallet (which is the clock), the wave, the calls, and the cards at either end.

const WORLD = BRAWL_CREW_WORLD;
const copy = brawlBackRoomLabCopy;

const text = (
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  size: number,
  colour: string,
  align: CanvasTextAlign = "center"
): void => {
  ctx.font = `800 ${size}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.fillStyle = colour;
  ctx.fillText(value, x, y);
};

const formatClock = (ticks: number): string => {
  const seconds = Math.max(0, Math.ceil(ticks / WORLD.tickHz));

  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
};

const paintWallet = (ctx: CanvasRenderingContext2D, run: BackRoomRun): void => {
  const tick = run.frame.tick;
  const left = resolveBackRoomClockTicks(run.settings) - tick;
  const isLastSong = left <= BACK_ROOM.songTicks;
  const colour = isLastSong ? backRoomInk.heat : backRoomInk.gold;

  ctx.fillStyle = backRoomInk.plate;
  ctx.fillRect(WORLD.width - 78, 2, 76, 20);
  text(ctx, copy.hud.wallet, WORLD.width - 5, 7.5, 3.4, backRoomInk.muted, "right");
  text(ctx, `$${run.billsLeft * BACK_ROOM.billDollars}`, WORLD.width - 5, 19, isLastSong ? 12 : 10, colour, "right");
  text(ctx, formatClock(left), WORLD.width - 44, 7.5, 3.4, backRoomInk.muted, "right");

  // The bills, and the one that is next burning down from its top.
  const isCharging = run.settings.isChargeOn && left <= BACK_ROOM.bills * BACK_ROOM.songTicks;
  const songLeft = isCharging ? (left % BACK_ROOM.songTicks) / BACK_ROOM.songTicks : 1;

  for (let bill = 0; bill < BACK_ROOM.bills; bill += 1) {
    const x = WORLD.width - 76 + bill * 4.6;
    const isKept = bill < run.billsLeft;

    ctx.fillStyle = isKept ? backRoomInk.bill : backRoomInk.billGone;
    ctx.fillRect(x, 10, 3.6, 9);

    if (isKept && bill === run.billsLeft - 1 && songLeft < 1) {
      ctx.fillStyle = backRoomInk.heat;
      ctx.fillRect(x, 10, 3.6, 9 * (1 - songLeft));
    }
  }

  if (run.lastChargeTick !== null && tick - run.lastChargeTick < 70) {
    text(ctx, copy.hud.charged, WORLD.width / 2, 34, 7, backRoomInk.heat);
  }
};

const paintCalls = (ctx: CanvasRenderingContext2D, run: BackRoomRun): void => {
  const { frame, sleeper, block } = run;
  const standing = frame.goons.filter((goon) => goon.state !== "ko" && goon.state !== "gone").length;
  const wave = Math.min(frame.waveIndex + 1, block.waves.length);
  const status =
    frame.waveIndex >= block.waves.length || (!frame.cameraLocked && standing === 0)
      ? copy.hud.clear
      : `${copy.hud.wave} ${wave} ${copy.hud.of} ${block.waves.length}`;

  ctx.fillStyle = backRoomInk.plate;
  ctx.fillRect(2, 2, 62, 14);
  text(ctx, status, 5, 8, 4.4, backRoomInk.text, "left");
  text(ctx, run.settings.mode === "carry" ? copy.hud.carryLine : copy.hud.herdLine, 5, 13.2, 2.6, backRoomInk.muted, "left");

  if (sleeper.carrier !== null) {
    text(ctx, copy.hud.gotHim, WORLD.width / 2, 12, 6, backRoomInk.sleeper);
  }

  if (frame.cameraLocked) {
    return;
  }

  // Between waves: the street says go, unless the camera is waiting for him.
  const lead = Math.max(...frame.hens.filter((hen) => hen.state === "up").map((hen) => hen.x), 0);
  const isWaiting = sleeper.carrier === null && frame.cameraX >= sleeper.x - BACK_ROOM.cameraLead - 2 && lead > sleeper.x + 40;

  if (isWaiting) {
    text(ctx, copy.hud.getHim, 6, 60, 6, backRoomInk.heat, "left");
  } else if (Math.floor(frame.tick / 20) % 2 === 0) {
    text(ctx, copy.hud.go, WORLD.width - 6, 60, 8, backRoomInk.gold, "right");
  }
};

const paintEndCard = (ctx: CanvasRenderingContext2D, run: BackRoomRun): void => {
  if (run.outcome === null) {
    return;
  }

  ctx.fillStyle = backRoomInk.veil;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  text(ctx, copy.end[run.outcome], WORLD.width / 2, 30, 13, run.outcome === "out" ? backRoomInk.gold : backRoomInk.heat);

  const lines = [
    `${copy.end.time}  ${formatClock(run.frame.tick)}`,
    `${copy.end.bills}  ${run.billsLeft} ${copy.hud.of} ${BACK_ROOM.bills}`,
    `${copy.end.worth}  ${run.banked} / ${run.total}`,
    ...run.tallies
      .slice(0, run.settings.humans)
      .map(
        (tally, slot) =>
          `${copy.scene.player}${slot + 1}: ${copy.end.lifts} ${tally.lifts} · ${copy.end.drops} ${tally.drops} · ${copy.end.carried} ${Math.round(tally.carried)} ${copy.end.units}`
      )
  ];

  lines.forEach((line, index) => {
    text(ctx, line, WORLD.width / 2, 46 + index * 8, 5, backRoomInk.text);
  });
  text(ctx, copy.end.again, WORLD.width / 2, 98, 4, backRoomInk.muted);
};

/** Everything over the street. `isStarted` is false until the first key or touch. */
export const paintBackRoomHud = (ctx: CanvasRenderingContext2D, run: BackRoomRun, isStarted: boolean): void => {
  paintWallet(ctx, run);
  paintCalls(ctx, run);
  paintEndCard(ctx, run);

  if (!isStarted) {
    ctx.fillStyle = backRoomInk.veil;
    ctx.fillRect(0, 44, WORLD.width, 22);
    text(ctx, copy.hud.start, WORLD.width / 2, 57.5, 6.5, backRoomInk.text);
  }
};
