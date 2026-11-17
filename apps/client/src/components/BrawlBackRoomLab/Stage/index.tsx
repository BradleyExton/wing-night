import { useEffect, useRef } from "react";
import { BRAWL_CREW_WORLD } from "@wingnight/shared";

import { createBackRoomRun, stepBackRoom, type BackRoomSettings } from "../backRoom";
import { backRoomInk } from "../palette";
import { paintBackRoomHud } from "../paintHud";
import { paintBackRoomStreet } from "../paintStreet";
import * as styles from "./styles";
import {
  BACK_ROOM_STICK_RADIUS_PX,
  createBackRoomThumbs,
  resolveBackRoomThumbInputs,
  wireBackRoomKeys,
  wireBackRoomTouch,
  type BackRoomStick
} from "../thumbs";

const WORLD = BRAWL_CREW_WORLD;
const TICK_MS = 1000 / WORLD.tickHz;
/** A tab that was hidden comes back with seconds owed; it is paid a few ticks at a time. */
const MAX_CATCH_UP_MS = 100;

type StageProps = {
  settings: BackRoomSettings;
  /** Bump to start the same settings again. */
  runKey: number;
};

/**
 * PROTOTYPE — throwaway. The block on a canvas. It keeps its own clock: sixty ticks a second of
 * the back room's rules, from the first key or touch, painted once a frame. Nothing here is React
 * state — the run lives in the effect — and the canvas carries the few facts a test can read.
 */
export const Stage = ({ settings, runKey }: StageProps): JSX.Element => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d") ?? null;

    if (canvas === null || context === null) {
      return;
    }

    let run = createBackRoomRun(settings);
    let isStarted = false;
    let stick: BackRoomStick | null = null;
    let last = performance.now();
    let owed = 0;
    let frameId = 0;
    const thumbs = createBackRoomThumbs();
    const start = (): void => {
      isStarted = true;
    };
    const unwireKeys = wireBackRoomKeys(thumbs, () => run.settings.humans, start);
    const unwireTouch =
      thumbs[0] === undefined
        ? (): void => {}
        : wireBackRoomTouch(
            canvas,
            thumbs[0],
            (next) => {
              stick = next;
            },
            start
          );

    const paint = (): void => {
      const ratio = window.devicePixelRatio || 1;
      const width = Math.round(canvas.clientWidth * ratio);
      const height = Math.round(canvas.clientHeight * ratio);

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      const scale = Math.min(width / WORLD.width, height / WORLD.height);

      context.setTransform(1, 0, 0, 1, 0, 0);
      context.fillStyle = backRoomInk.void;
      context.fillRect(0, 0, width, height);
      context.setTransform(scale, 0, 0, scale, (width - WORLD.width * scale) / 2, (height - WORLD.height * scale) / 2);
      context.save();
      context.beginPath();
      context.rect(0, 0, WORLD.width, WORLD.height);
      context.clip();
      context.translate(-run.frame.cameraX, 0);
      paintBackRoomStreet(context, run);
      context.restore();
      paintBackRoomHud(context, run, isStarted);

      // The stick's ring, in the screen's own pixels, wherever the thumb landed.
      if (stick !== null) {
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        context.strokeStyle = backRoomInk.text;
        context.globalAlpha = 0.5;
        context.lineWidth = 2;
        context.beginPath();
        context.arc(stick.cx, stick.cy, BACK_ROOM_STICK_RADIUS_PX, 0, Math.PI * 2);
        context.stroke();
        context.beginPath();
        context.arc(stick.x, stick.y, 16, 0, Math.PI * 2);
        context.fillStyle = backRoomInk.text;
        context.fill();
        context.globalAlpha = 1;
      }

      canvas.dataset.outcome = run.outcome ?? "";
      canvas.dataset.tick = String(run.frame.tick);
      canvas.dataset.bills = String(run.billsLeft);
      canvas.dataset.sleeperX = run.sleeper.x.toFixed(1);
      canvas.dataset.sleeperZ = run.sleeper.z.toFixed(1);
      canvas.dataset.carrier = run.sleeper.carrier === null ? "" : String(run.sleeper.carrier);
      canvas.dataset.henX = (run.frame.hens[0]?.x ?? 0).toFixed(1);
      canvas.dataset.henZ = (run.frame.hens[0]?.z ?? 0).toFixed(1);
      canvas.dataset.goons = String(run.frame.goons.filter((goon) => goon.state !== "ko" && goon.state !== "gone").length);
    };

    const loop = (now: number): void => {
      owed += Math.min(MAX_CATCH_UP_MS, now - last);
      last = now;

      while (owed >= TICK_MS) {
        owed -= TICK_MS;

        if (isStarted) {
          run = stepBackRoom(run, resolveBackRoomThumbInputs(run.frame, thumbs, run.settings.humans));
        }
      }

      paint();
      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);

    return (): void => {
      cancelAnimationFrame(frameId);
      unwireKeys();
      unwireTouch();
    };
  }, [settings, runKey]);

  return <canvas ref={canvasRef} className={styles.canvas} data-back-room-stage />;
};
