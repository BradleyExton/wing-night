import { MOUNT_WORLD, type MountGooseStance, type MountShape, type MountVec } from "@wingnight/shared";

import * as styles from "./styles.js";

type Circle = Extract<MountShape, { kind: "circle" }>;
type Capsule = Extract<MountShape, { kind: "capsule" }>;

// The plinth's top surface, where the goose's feet stand.
const SURFACE_Y = -(MOUNT_WORLD.plinth.height + MOUNT_WORLD.plinth.edgeRadius);

const circleAt = (shapes: readonly MountShape[], index: number): Circle | null => {
  const shape = shapes[index];

  return shape?.kind === "circle" ? shape : null;
};

const capsuleAt = (shapes: readonly MountShape[], index: number): Capsule | null => {
  const shape = shapes[index];

  return shape?.kind === "capsule" ? shape : null;
};

const unit = (from: MountVec, to: MountVec): MountVec => {
  const length = Math.hypot(to.x - from.x, to.y - from.y) || 1;

  return { x: (to.x - from.x) / length, y: (to.y - from.y) / length };
};

/**
 * The round's goose in the stance its seed dealt, drawn over the sim's own shapes (body ball,
 * neck, head, bill) so every hold a hen takes on it is where it looks: grey-brown body and folded
 * wing, the black neck, the white chinstrap, the house goose's orange bill.
 */
export const Goose = ({ stance }: { stance: MountGooseStance }): JSX.Element | null => {
  const { shapes } = MOUNT_WORLD.goose[stance];
  const body = circleAt(shapes, 0);
  const neck = capsuleAt(shapes, 1);
  const head = circleAt(shapes, 2);
  const bill = capsuleAt(shapes, 3);

  if (body === null || neck === null || head === null || bill === null) {
    return null;
  }

  const facing = unit(head.c, bill.b);
  const r = body.r;
  const tailX = body.c.x - r * 1.15;
  const cheek = { x: head.c.x - facing.x * 2.5, y: head.c.y + 3.5 };
  const eye = { x: head.c.x + facing.x * 4, y: head.c.y - 2.5 };

  return (
    <g data-mount-goose={stance} aria-hidden="true">
      <line className={styles.legs} x1={body.c.x - 7} y1={body.c.y + r - 4} x2={body.c.x - 9} y2={SURFACE_Y} />
      <line className={styles.legs} x1={body.c.x + 6} y1={body.c.y + r - 4} x2={body.c.x + 8} y2={SURFACE_Y} />
      <path
        className={styles.tail}
        d={`M ${body.c.x - r * 0.6} ${body.c.y - 6} L ${tailX} ${body.c.y - 12} L ${tailX + 2} ${body.c.y + 4} Z`}
      />
      <circle className={styles.body} cx={body.c.x} cy={body.c.y} r={r} />
      <ellipse
        className={styles.wing}
        cx={body.c.x - 6}
        cy={body.c.y - 3}
        rx={r * 0.66}
        ry={r * 0.34}
        transform={`rotate(-14 ${body.c.x - 6} ${body.c.y - 3})`}
      />
      <line className={styles.rim} x1={neck.a.x} y1={neck.a.y} x2={neck.b.x} y2={neck.b.y} strokeWidth={neck.r * 2 + 1.6} strokeLinecap="round" />
      <line className={styles.neck} x1={neck.a.x} y1={neck.a.y} x2={neck.b.x} y2={neck.b.y} strokeWidth={neck.r * 2} strokeLinecap="round" />
      <line className={styles.bill} x1={bill.a.x} y1={bill.a.y} x2={bill.b.x} y2={bill.b.y} strokeWidth={bill.r * 1.6} strokeLinecap="round" />
      <circle className={styles.head} cx={head.c.x} cy={head.c.y} r={head.r} />
      <ellipse className={styles.cheek} cx={cheek.x} cy={cheek.y} rx={5.5} ry={3.4} />
      <circle className={styles.eye} cx={eye.x} cy={eye.y} r={1.3} />
    </g>
  );
};
