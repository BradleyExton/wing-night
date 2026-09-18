import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type {
  JoustAim,
  JoustMinigameArena,
  JoustMinigameShot,
  JoustPlayerFigure
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
  serverOrigin: string | null;
  aim: JoustAim;
  lastShot: JoustMinigameShot | null;
  canAim: boolean;
  sceneLabel: string;
  onAim: (aim: JoustAim) => void;
  onLaunch: (aim: JoustAim) => void;
};

// Maps a pointer inside the letterboxed SVG back to world units. The scene
// uses `xMidYMid meet`, so the drawn world is the largest 16:9 box that fits,
// centred.
const toWorldPoint = (
  bounds: DOMRect,
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
// the band's radius. Forward pulls are pinned to slack rather than allowed to
// fire the shooter backwards — a tap on the rack's side of the lane reads
// as pointing, not pulling.
const toAim = (bounds: DOMRect, clientX: number, clientY: number): JoustAim => {
  const point = toWorldPoint(bounds, clientX, clientY);

  return clampJoustAim({
    x: Math.min(0, (point.x - JOUST_WORLD.anchor.x) / JOUST_WORLD.pullRadius),
    y: (point.y - JOUST_WORLD.anchor.y) / JOUST_WORLD.pullRadius
  });
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
  const scene = resolveJoustScene(arena, lineup, downPlayerIds, shownAim, lastShot, replayIndex);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (!canAim || lastShot !== null) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);

    const nextAim = toAim(event.currentTarget.getBoundingClientRect(), event.clientX, event.clientY);

    setLocalAim(nextAim);
    lastDispatchAtRef.current = Date.now();
    onAim(nextAim);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (localAim === null) {
      return;
    }

    const nextAim = toAim(event.currentTarget.getBoundingClientRect(), event.clientX, event.clientY);

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

    const finalAim = toAim(event.currentTarget.getBoundingClientRect(), event.clientX, event.clientY);

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
        teammates={teammates}
        activeShooterPlayerId={activeShooterPlayerId}
        isAiming={isAiming}
        burstPinIndices={scene.burstPinIndices}
        trail={scene.trail}
        serverOrigin={serverOrigin}
        sceneId="host-joust"
        label={sceneLabel}
      />
    </div>
  );
};
