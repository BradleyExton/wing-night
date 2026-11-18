import { BRAWL_CREW_WORLD, type BrawlCrewGoon, type BrawlCrewHen } from "@wingnight/shared";

import { BACK_ROOM, type BackRoomRun, type BackRoomStaff } from "../backRoom";
import { brawlBackRoomLabCopy } from "../copy";
import { backRoomGoonColours, backRoomInk, backRoomRooms, backRoomSlotColours } from "../palette";

// PROTOTYPE — throwaway. The block as flat shapes on a canvas, in the sim's own units: the caller
// has already scaled the context to one unit a world unit and slid it to the camera.

const WORLD = BRAWL_CREW_WORLD;
const copy = brawlBackRoomLabCopy;
/** The back of the band: a figure at depth z stands at this plus z (DESIGN.md §2.14). */
const BAND_Y = 70;

const label = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, colour: string): void => {
  ctx.font = `700 ${size}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillStyle = colour;
  ctx.fillText(text, x, y);
};

const ellipse = (ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number): void => {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
};

/** A ring that closes as a count runs: the revive's, and the lift's. */
const countRing = (ctx: CanvasRenderingContext2D, x: number, y: number, share: number): void => {
  ctx.beginPath();
  ctx.arc(x, y, 9, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, Math.min(1, share)));
  ctx.strokeStyle = backRoomInk.gold;
  ctx.lineWidth = 1.2;
  ctx.stroke();
};

const paintRooms = (ctx: CanvasRenderingContext2D, run: BackRoomRun): void => {
  for (const room of backRoomRooms) {
    ctx.fillStyle = room.wall;
    ctx.fillRect(room.from, 0, room.to - room.from, BAND_Y);
    ctx.fillStyle = room.floor;
    ctx.fillRect(room.from, BAND_Y, room.to - room.from, WORLD.height - BAND_Y);
    ctx.textAlign = "left";
    ctx.font = "700 5px ui-sans-serif, system-ui, sans-serif";
    ctx.fillStyle = backRoomInk.muted;
    ctx.fillText(copy.rooms[room.key], room.from + 4, 30);
  }

  // The seams between the camera's windows, and the furniture that says which room this is.
  ctx.strokeStyle = backRoomInk.seam;
  ctx.lineWidth = 0.4;
  ctx.setLineDash([3, 3]);

  for (const wave of run.block.waves) {
    if (wave.lockX > 0) {
      ctx.beginPath();
      ctx.moveTo(wave.lockX, BAND_Y);
      ctx.lineTo(wave.lockX, WORLD.height);
      ctx.stroke();
    }
  }

  ctx.setLineDash([]);
  ctx.fillStyle = "#b91c1c";
  ctx.fillRect(8, 34, 22, 14);
  label(ctx, copy.scene.sign, 19, 43, 3, backRoomInk.text);
  ctx.fillStyle = "#27272a";
  ctx.fillRect(84, 54, 60, 16);
  label(ctx, copy.scene.stage, 114, 64, 4, backRoomInk.muted);
  ctx.fillStyle = "#7f1d1d";
  ctx.fillRect(BACK_ROOM.sleeperX - 22, 56, 44, 14);
  label(ctx, copy.scene.couch, BACK_ROOM.sleeperX, 65, 4, backRoomInk.muted);
  ctx.fillStyle = "#3f3f46";
  ctx.fillRect(544, 40, 20, 30);
  label(ctx, copy.scene.door, 554, 37, 4, backRoomInk.heat);

  const hazard = run.block.hazard;

  if (hazard !== null) {
    ctx.fillStyle = backRoomInk.hazard;
    ctx.fillRect(hazard.x, BAND_Y + 2, hazard.width, WORLD.depth - 2);
    ctx.fillStyle = backRoomInk.hazardFelt;
    ctx.fillRect(hazard.x + 2, BAND_Y + 4, hazard.width - 4, WORLD.depth - 6);
    label(ctx, copy.scene.hazard, hazard.x + hazard.width / 2, BAND_Y + 19, 3, backRoomInk.hazard);
  }

  // The way out: a dashed line across the band, and the cab waiting past it.
  ctx.strokeStyle = backRoomInk.text;
  ctx.lineWidth = 0.8;
  ctx.setLineDash([2, 2]);
  ctx.beginPath();
  ctx.moveTo(run.block.exitX, BAND_Y);
  ctx.lineTo(run.block.exitX, WORLD.height);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = backRoomInk.cab;
  ctx.fillRect(run.block.exitX + 4, 54, 24, 10);
  ctx.fillRect(run.block.exitX + 9, 48, 13, 7);
  label(ctx, copy.scene.cab, run.block.exitX + 16, 62, 4, backRoomInk.void);
};

const paintSleeper = (ctx: CanvasRenderingContext2D, x: number, y: number): void => {
  ctx.fillStyle = backRoomInk.sleeper;
  ellipse(ctx, x, y - 3, 7, 3);
  ctx.fill();
  ellipse(ctx, x + 7, y - 4, 2.8, 2.8);
  ctx.fill();
  label(ctx, copy.scene.asleep, x + 4, y - 9, 3.5, backRoomInk.sleeper);
};

const paintHen = (ctx: CanvasRenderingContext2D, hen: BrawlCrewHen, run: BackRoomRun): void => {
  const tick = run.frame.tick;
  const y = BAND_Y + hen.z;
  const ring = backRoomSlotColours[hen.slot % backRoomSlotColours.length] ?? backRoomInk.text;
  const isPerson = hen.slot < run.settings.humans;

  ctx.fillStyle = backRoomInk.shadow;
  ellipse(ctx, hen.x, y, 6, 1.8);
  ctx.fill();
  ctx.strokeStyle = ring;
  ctx.lineWidth = isPerson ? 1.2 : 0.6;
  ellipse(ctx, hen.x, y, 7.5, 2.4);
  ctx.stroke();

  if (hen.state === "down") {
    ctx.fillStyle = backRoomInk.henDown;
    ellipse(ctx, hen.x, y - 3, 7, 3);
    ctx.fill();
    if (hen.reviveSinceTick !== null) {
      countRing(ctx, hen.x, y - 3, (tick - hen.reviveSinceTick) / WORLD.reviveTicks);
    }

    return;
  }

  // She flickers through her mercy window, and sits dim when her pad has gone quiet.
  const isFlicker = tick < hen.invulnerableUntilTick && Math.floor(tick / 4) % 2 === 1;

  ctx.globalAlpha = hen.state === "away" ? 0.4 : isFlicker ? 0.45 : 1;
  ctx.fillStyle = backRoomInk.hen;
  ellipse(ctx, hen.x, y - 6, 4.6, 5.4);
  ctx.fill();
  ellipse(ctx, hen.x + hen.facing * 2.2, y - 13, 3.4, 3.4);
  ctx.fill();
  ctx.strokeStyle = backRoomInk.beak;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(hen.x + hen.facing * 5, y - 13);
  ctx.lineTo(hen.x + hen.facing * (tick < hen.peckUntilTick ? WORLD.henRadius + WORLD.peckReach : 8), y - 13);
  ctx.stroke();
  ctx.globalAlpha = 1;

  if (run.sleeper.carrier === hen.slot) {
    paintSleeper(ctx, hen.x - hen.facing * 2, y - 16);
  }

  for (let heart = 0; heart < hen.hearts; heart += 1) {
    ctx.fillStyle = backRoomInk.heat;
    ctx.fillRect(hen.x - 4.5 + heart * 3.4, y + 3.6, 2.4, 1.6);
  }
};

/** Who she is, over her head: painted after every figure, so no bird hides another's name. */
const paintHenName = (ctx: CanvasRenderingContext2D, hen: BrawlCrewHen, run: BackRoomRun): void => {
  const y = BAND_Y + hen.z;
  const ring = backRoomSlotColours[hen.slot % backRoomSlotColours.length] ?? backRoomInk.text;
  const name = hen.slot < run.settings.humans ? `${copy.scene.player}${hen.slot + 1}` : copy.scene.bot;

  if (hen.state === "down") {
    label(ctx, `${name} ${copy.scene.down}`, hen.x, y - 9, 3.5, ring);
  } else {
    label(ctx, name, hen.x, y - (run.sleeper.carrier === hen.slot ? 30 : 20), 3.5, ring);
  }
};

const paintGoon = (ctx: CanvasRenderingContext2D, goon: BrawlCrewGoon): void => {
  const stats = WORLD.goons[goon.kind];
  const feet = BAND_Y + goon.z;
  const middle = feet - goon.y - stats.height / 2;

  ctx.fillStyle = backRoomInk.shadow;
  ellipse(ctx, goon.x, feet, stats.halfWidth + 1, 1.8);
  ctx.fill();
  ctx.globalAlpha = goon.state === "ko" ? 0.3 : 1;
  ctx.fillStyle = backRoomGoonColours[goon.kind];
  ellipse(ctx, goon.x, middle, stats.halfWidth, stats.height / 2);
  ctx.fill();
  ctx.fillStyle = backRoomInk.void;
  ellipse(ctx, goon.x + goon.facing * (stats.halfWidth - 1), middle - stats.height / 3, 1.6, 1.6);
  ctx.fill();
  ctx.globalAlpha = 1;

  if (goon.state === "telegraph") {
    ctx.strokeStyle = backRoomInk.heat;
    ctx.lineWidth = 1;
    ellipse(ctx, goon.x, middle, stats.halfWidth + 1.5, stats.height / 2 + 1.5);
    ctx.stroke();
  }

  if (goon.kind === "boss" && goon.state !== "ko") {
    label(ctx, copy.scene.bouncer, goon.x, middle - stats.height / 2 - 6, 3.5, backRoomInk.heat);
  }

};

/**
 * One of the staff: a goose in the house's purple, out of the back room for him. One that has him
 * is tied to him by a line and says how many pecks it will take; one tugging at his carrier
 * flashes.
 */
const paintStaff = (ctx: CanvasRenderingContext2D, one: BackRoomStaff, run: BackRoomRun): void => {
  const feet = BAND_Y + one.z;
  const middle = feet - 8;
  const isTugging = one.grabSinceTick !== null && Math.floor(run.frame.tick / 4) % 2 === 0;

  ctx.fillStyle = backRoomInk.shadow;
  ellipse(ctx, one.x, feet, 6, 1.8);
  ctx.fill();
  ctx.globalAlpha = one.koTick === null ? 1 : 0.3;
  ctx.fillStyle = backRoomInk.staff;
  ellipse(ctx, one.x, middle, BACK_ROOM.staffHalfWidth, 7);
  ctx.fill();
  ellipse(ctx, one.x + one.facing * 3, middle - 10, 2.6, 2.6);
  ctx.fill();
  ctx.globalAlpha = 1;

  if (one.koTick !== null) {
    return;
  }

  ctx.strokeStyle = backRoomInk.heat;
  ctx.lineWidth = isTugging ? 2 : 1;
  ellipse(ctx, one.x, middle, BACK_ROOM.staffHalfWidth + 1.5, 8.5);
  ctx.stroke();

  if (one.hasHim) {
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(one.x, middle);
    ctx.lineTo(run.sleeper.x, BAND_Y + run.sleeper.z - 3);
    ctx.stroke();
    label(ctx, `${copy.scene.hasHim} ×${one.grip + 1}`, one.x, middle - 15, 3.5, backRoomInk.heat);
  } else {
    label(ctx, one.grabSinceTick === null ? copy.scene.staff : copy.scene.tugging, one.x, middle - 15, 3.5, backRoomInk.heat);
  }
};

/** The whole block at one tick: rooms, then every figure from the back of the band to the front. */
export const paintBackRoomStreet = (ctx: CanvasRenderingContext2D, run: BackRoomRun): void => {
  const { frame, sleeper } = run;

  paintRooms(ctx, run);

  for (const pickup of frame.pickups) {
    ctx.fillStyle = backRoomInk.gold;
    ellipse(ctx, pickup.x, BAND_Y + pickup.z - 1, 2.4, 1.4);
    ctx.fill();
  }

  type Figure = { z: number; paint: () => void };

  const figures: Figure[] = [
    ...frame.hens.map((hen): Figure => ({ z: hen.z, paint: () => paintHen(ctx, hen, run) })),
    ...frame.goons
      .filter((goon) => goon.state !== "gone")
      .map((goon): Figure => ({ z: goon.z, paint: () => paintGoon(ctx, goon) })),
    ...run.staff.map((one): Figure => ({ z: one.z + 0.05, paint: () => paintStaff(ctx, one, run) }))
  ];

  if (sleeper.carrier === null) {
    figures.push({
      z: sleeper.z - 0.1,
      paint: () => {
        const y = BAND_Y + sleeper.z;

        paintSleeper(ctx, sleeper.x, y);

        if (sleeper.liftSinceTick !== null) {
          countRing(ctx, sleeper.x, y - 3, (frame.tick - sleeper.liftSinceTick) / BACK_ROOM.liftTicks);
        }

        if (run.lastDropTick !== null && frame.tick - run.lastDropTick < 45) {
          label(ctx, copy.hud.dropped, sleeper.x, y - 14, 4, backRoomInk.heat);
        }
      }
    });
  }

  figures.sort((left, right) => left.z - right.z);

  for (const figure of figures) {
    figure.paint();
  }

  for (const hen of frame.hens) {
    paintHenName(ctx, hen, run);
  }
};
