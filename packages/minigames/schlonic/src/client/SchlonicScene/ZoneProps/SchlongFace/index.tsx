import { resolveSchlongFace, type SchlongVec2 } from "@wingnight/cast";

import { schlonicPalette } from "../../palette.js";

// Two white eyes and a smile on the glans, the JOUST convention. Only the enemy gets one: a
// face is how the room tells the thing that is alive from the scenery that is not.
export const SchlongFace = ({
  head,
  headRadius,
  lookAt
}: {
  head: SchlongVec2;
  headRadius: number;
  lookAt: SchlongVec2;
}): JSX.Element => {
  const face = resolveSchlongFace(head, headRadius, lookAt);

  return (
    <g>
      <circle cx={face.leftEye.x} cy={face.leftEye.y} r={face.eyeRadius} fill={schlonicPalette.eye} />
      <circle cx={face.rightEye.x} cy={face.rightEye.y} r={face.eyeRadius} fill={schlonicPalette.eye} />
      <circle
        cx={face.leftEye.x + face.pupilOffset.x}
        cy={face.leftEye.y + face.pupilOffset.y}
        r={face.pupilRadius}
        fill={schlonicPalette.pupil}
      />
      <circle
        cx={face.rightEye.x + face.pupilOffset.x}
        cy={face.rightEye.y + face.pupilOffset.y}
        r={face.pupilRadius}
        fill={schlonicPalette.pupil}
      />
      <path
        d={face.mouth}
        fill="none"
        stroke={schlonicPalette.schlongDark}
        strokeWidth={0.35}
        strokeLinecap="round"
      />
    </g>
  );
};
