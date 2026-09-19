import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type {
  JoustAim,
  JoustMinigameArena,
  JoustMinigameShot,
  JoustPlayerFigure,
  JoustShotGhost
} from "@wingnight/shared";
import { JOUST_WORLD, clampJoustAim } from "@wingnight/shared";

import { JOUST_MIN_LAUNCH_PULL } from "../../../runtime/types/index.js";
import { JoustArenaScene } from "../../JoustArenaScene/index.js";
import { resolveJoustScene } from "../../resolveJoustScene/index.js";
import { useShotReplay } from "../../useShotReplay/index.js";
import * as styles from "./styles.js";

// ~12 sends/sec keeps the TV's band moving while staying well under the
// dispatch budget the drawing canvas set (~15/sec).
const AIM_DISPATCH_INTERVAL_MS = 80;

type AimArenaProps = {
  arena: JoustMinigameArena;
  lineup: JoustPlayerFigure[];
  teammates: JoustPlayerFigure[];
  activeShooterPlayerId: string | null;
  downPlayerIds: string[];
  collapsedPerchIndices: number[];
  previousShotGhost: JoustShotGhost | null;
  serverOrigin: string | null;
  aim: JoustAim;
  lastShot: JoustMinigameShot | null;
  canAim: boolean;
  sceneLabel: string;
  onAim: (aim: JoustAim) => void;
  onLaunch: (aim: JoustAim) => void;
};

/** Everything the pointer maths reads off the arena's box, so a test can hand it one. */
export type AimArenaBounds = Pick<DOMRect, "left" | "top" | "width" | "height">;

// Maps a pointer inside the letterboxed SVG back to world units. The scene
// uses `xMidYMid meet`, so the drawn world is the largest 16:9 box that fits,
// centred.
const toWorldPoint = (
  bounds: AimArenaBounds,
  clientX: number,
  clientY: number
): { x: number; y: number } => {
  const scale = Math.min(
    bounds.width / JOUST_WORLD.width,
    bounds.height / JOUST_WORLD.height
  );
  const safeScale = scale > 0 ? scale : 1;
  const offsetX = (bounds.width - JOUST_WORLD.width * safeScale) / 2;
  const offsetY = (bounds.height - JOUST_WORLD.height * safeScale) / 2;

  return {
    x: (clientX - bounds.left - offsetX) / safeScale,
    y: (clientY - bounds.top - offsetY) / safeScale
  };
};

// The pull is the pointer's offset from the slingshot fork, as a fraction of
// the band's radius. A touch at or forward of the fork is pointing down the
// lane, not pulling, so the WHOLE pull goes slack: pinning only its x still
// left a tap on a bird as a full-power pull straight up or down, which fired
// the shooter and spent that player's only shot of the turn. A near-vertical
// shot is still there for anyone who wants it — a hair behind the fork is a pull.
export const resolveAimFromPointer = (
  bounds: AimArenaBounds,
  clientX: number,
  clientY: number
): JoustAim => {
  const point = toWorldPoint(bounds, clientX, clientY);
  const pull = {
    x: (point.x - JOUST_WORLD.anchor.x) / JOUST_WORLD.pullRadius,
    y: (point.y - JOUST_WORLD.anchor.y) / JOUST_WORLD.pullRadius
  };

  return pull.x >= 0 ? { x: 0, y: 0 } : clampJoustAim(pull);
};

const magnitude = (aim: JoustAim): number => {
  return Math.sqrt(aim.x * aim.x + aim.y * aim.y);
};

export const AimArena = ({
  arena,
  lineup,
  teammates,
  activeShooterPlayerId,
  downPlayerIds,
  collapsedPerchIndices,
  previousShotGhost,
  serverOrigin,
  aim,
  lastShot,
  canAim,
  sceneLabel,
  onAim,
  onLaunch
}: AimArenaProps): JSX.Element => {
  // The finger's own pull, shown immediately; the server's echo replaces it
  // once the drag ends so the tablet and the TV agree on the rest pose.
  const [localAim, setLocalAim] = useState<JoustAim | null>(null);
  const lastDispatchAtRef = useRef(0);
  const replayIndex = useShotReplay(lastShot);
  const shownAim = localAim ?? aim;
  const isAiming = lastShot === null && (canAim || magnitude(shownAim) > 0);
  const scene = resolveJoustScene({
    arena,
    lineup,
    downPlayerIds,
    collapsedPerchIndices,
    aim: shownAim,
    lastShot,
    replayIndex,
    previousShotGhost
  });

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (!canAim || lastShot !== null) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);

    const nextAim = resolveAimFromPointer(
      event.currentTarget.getBoundingClientRect(),
      event.clientX,
      event.clientY
    );

    setLocalAim(nextAim);
    lastDispatchAtRef.current = Date.now();
    onAim(nextAim);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (localAim === null) {
      return;
    }

    const nextAim = resolveAimFromPointer(
      event.currentTarget.getBoundingClientRect(),
      event.clientX,
      event.clientY
    );

    setLocalAim(nextAim);

    const now = Date.now();

    if (now - lastDispatchAtRef.current >= AIM_DISPATCH_INTERVAL_MS) {
      lastDispatchAtRef.current = now;
      onAim(nextAim);
    }
  };

  const handlePointerEnd = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (localAim === null) {
      return;
    }

    const finalAim = resolveAimFromPointer(
      event.currentTarget.getBoundingClientRect(),
      event.clientX,
      event.clientY
    );

    setLocalAim(null);

    if (magnitude(finalAim) >= JOUST_MIN_LAUNCH_PULL) {
      onLaunch(finalAim);
      return;
    }

    onAim({ x: 0, y: 0 });
  };

  const handlePointerCancel = (): void => {
    if (localAim === null) {
      return;
    }

    setLocalAim(null);
    onAim({ x: 0, y: 0 });
  };

  return (
    <div
      className={`${styles.surface} ${canAim && lastShot === null ? styles.surfaceArmed : styles.surfaceLocked}`}
      data-joust-aim-arena
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerCancel}
    >
      <JoustArenaScene
        arena={arena}
        frame={scene.frame}
        pins={scene.pins}
        fallen={scene.fallen}
        legs={scene.legs}
        rubblePerchIndices={scene.rubblePerchIndices}
        collapsingPerchIndices={scene.collapsingPerchIndices}
        teammates={teammates}
        activeShooterPlayerId={activeShooterPlayerId}
        isAiming={isAiming}
        burstPinIndices={scene.burstPinIndices}
        trail={scene.trail}
        ghost={scene.ghost}
        serverOrigin={serverOrigin}
        sceneId="host-joust"
        label={sceneLabel}
      />
    </div>
  );
};
