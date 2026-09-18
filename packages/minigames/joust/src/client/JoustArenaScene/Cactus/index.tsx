import type { JoustObstacle } from "@wingnight/shared";

import { joustPalette } from "../palette.js";

export const Cactus = ({ obstacle }: { obstacle: JoustObstacle }): JSX.Element => {
  const radius = Math.min(obstacle.width / 2, 4);
  const hasArms = obstacle.height >= 16;
  const armY = obstacle.y + obstacle.height * 0.42;
  const armWidth = Math.max(2.4, obstacle.width * 0.55);

  return (
    <g>
      <rect
        x={obstacle.x}
        y={obstacle.y}
        width={obstacle.width}
        height={obstacle.height}
        rx={radius}
        fill={joustPalette.cactus}
        stroke={joustPalette.cactusDark}
        strokeWidth={0.8}
      />
      {hasArms && (
        <>
          <rect
            x={obstacle.x - armWidth - 0.6}
            y={armY}
            width={armWidth + 1.2}
            height={armWidth}
            rx={armWidth / 2}
            fill={joustPalette.cactus}
            stroke={joustPalette.cactusDark}
            strokeWidth={0.8}
          />
          <rect
            x={obstacle.x - armWidth - 0.6}
            y={armY - obstacle.height * 0.22}
            width={armWidth}
            height={obstacle.height * 0.22 + armWidth}
            rx={armWidth / 2}
            fill={joustPalette.cactus}
            stroke={joustPalette.cactusDark}
            strokeWidth={0.8}
          />
        </>
      )}
      <line
        x1={obstacle.x + obstacle.width * 0.5}
        y1={obstacle.y + radius}
        x2={obstacle.x + obstacle.width * 0.5}
        y2={obstacle.y + obstacle.height - 1}
        stroke={joustPalette.cactusLight}
        strokeWidth={0.7}
        strokeDasharray="1.2 1.6"
        opacity={0.7}
      />
    </g>
  );
};
