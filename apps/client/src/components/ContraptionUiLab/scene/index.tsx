import type { ProjectileId } from "../projectile";
import type { SequencePosition } from "../sequence";
import type { RunOutcome } from "./flightPath";

/**
 * What every variant needs to draw a frame. The variants share these primitives and this contract
 * but not a layout — the whole point of the comparison is that the composition differs.
 */
export type VariantSceneProps = {
  position: SequencePosition;
  outcome: RunOutcome;
  projectile: ProjectileId;
  avatarSrc?: string;
};

// Placeholder art. AC#4 is explicit that the art is not what is being decided — the CONVENTION is —
// so these are flat shapes chosen to be readable at TV distance, not drawings.
const PALETTE = {
  skin: "#e8b58b",
  shirt: "#3b82f6",
  cleanerShirt: "#ec4899",
  hair: "#3f2a1d",
  bone: "#f5ead6",
  boneShadow: "#d9c7a6",
  ramp: "#f59e0b",
  can: "#64748b",
  canDark: "#475569",
  floor: "#1e293b"
};

/**
 * The player likeness. The landed convention for a *player* is `avatarSrc` on `players[]` (the
 * content loader and the admin roster editor both carry it); the sprite booth mockup is how a photo
 * becomes the dithered sprite that would fill it. `spriteSrc` on `leaders[]` in the PETMON design
 * doc is doc-only — PETMON is not built — so this prop follows the field that actually exists.
 */
export type LikenessProps = {
  avatarSrc?: string;
};

const Likeness = ({ avatarSrc }: LikenessProps): JSX.Element => {
  if (avatarSrc === undefined) {
    return (
      <g>
        <circle cx={0} cy={0} r={16} fill={PALETTE.skin} />
        <path d="M -16 -4 A 16 16 0 0 1 16 -4 L 16 -10 A 16 16 0 0 0 -16 -10 Z" fill={PALETTE.hair} />
        <circle cx={-6} cy={0} r={2} fill="#1f2937" />
        <circle cx={6} cy={0} r={2} fill="#1f2937" />
      </g>
    );
  }

  return (
    <g>
      <clipPath id="likeness-clip">
        <circle cx={0} cy={0} r={16} />
      </clipPath>
      <image href={avatarSrc} x={-16} y={-16} width={32} height={32} clipPath="url(#likeness-clip)" />
    </g>
  );
};

export type ThrowerProps = LikenessProps & {
  /** Mid-eat until the eat finishes; the arm drops on release. */
  chewing: boolean;
  holding: boolean;
};

export const Thrower = ({ avatarSrc, chewing, holding }: ThrowerProps): JSX.Element => {
  return (
    <g>
      <rect x={-14} y={16} width={28} height={44} rx={9} fill={PALETTE.shirt} />
      <g transform="translate(0, -6)">
        <Likeness avatarSrc={avatarSrc} />
      </g>
      {/* The eating arm: raised to the mouth while chewing, dropped once the bone is gone. */}
      <g transform={chewing ? "rotate(-38, 12, 24)" : "rotate(10, 12, 24)"}>
        <rect x={10} y={18} width={9} height={26} rx={4.5} fill={PALETTE.skin} />
      </g>
      {holding ? <circle cx={18} cy={10} r={5} fill={PALETTE.bone} /> : null}
      {chewing ? (
        <circle cx={0} cy={6} r={4} fill="#b45309" opacity={0.75} />
      ) : null}
    </g>
  );
};

export type ProjectileSpriteProps = {
  kind: ProjectileId;
  scale?: number;
};

/**
 * AC#5's demonstration, and the reason this is a scripted scene rather than a run of the real
 * integrator: the sprite is drawn at a FIXED orientation for the whole flight, because the
 * integrator carries no angular state and therefore cannot tumble a sprite. The drumette is
 * radially symmetric enough that this never shows; the flat bone holds one angle all the way down,
 * which is exactly the "reads as broken" the ticket asks a human to judge on sight.
 */
export const ProjectileSprite = ({ kind, scale = 1 }: ProjectileSpriteProps): JSX.Element => {
  if (kind === "drumette") {
    return (
      <g transform={`scale(${scale})`}>
        <circle cx={0} cy={0} r={11} fill={PALETTE.bone} />
        <circle cx={-3} cy={-3} r={7} fill="#fffaf0" opacity={0.6} />
        <rect x={8} y={-3} width={9} height={6} rx={3} fill={PALETTE.boneShadow} />
      </g>
    );
  }

  return (
    <g transform={`scale(${scale}) rotate(-18)`}>
      <rect x={-22} y={-4} width={44} height={8} rx={4} fill={PALETTE.bone} />
      <circle cx={-22} cy={0} r={7} fill={PALETTE.bone} />
      <circle cx={22} cy={0} r={7} fill={PALETTE.bone} />
      <rect x={-14} y={-1} width={28} height={2} rx={1} fill={PALETTE.boneShadow} opacity={0.7} />
    </g>
  );
};

export type RampProps = {
  length: number;
  angleDeg: number;
};

export const Ramp = ({ length, angleDeg }: RampProps): JSX.Element => {
  return (
    <g transform={`rotate(${angleDeg})`}>
      <rect x={0} y={-5} width={length} height={10} rx={5} fill={PALETTE.ramp} />
    </g>
  );
};

export type TrashCanProps = {
  scale?: number;
  /** Foregrounded cans get a rim highlight so they read as in front of the field, not part of it. */
  foregrounded?: boolean;
};

export const TrashCan = ({ scale = 1, foregrounded = false }: TrashCanProps): JSX.Element => {
  return (
    <g transform={`scale(${scale})`}>
      <path d="M -26 -30 L 26 -30 L 20 34 L -20 34 Z" fill={PALETTE.can} />
      <rect x={-30} y={-38} width={60} height={10} rx={5} fill={PALETTE.canDark} />
      {foregrounded ? (
        <rect x={-30} y={-38} width={60} height={10} rx={5} fill="#f8fafc" opacity={0.35} />
      ) : null}
      <rect x={-12} y={-18} width={5} height={44} rx={2.5} fill={PALETTE.canDark} opacity={0.5} />
      <rect x={7} y={-18} width={5} height={44} rx={2.5} fill={PALETTE.canDark} opacity={0.5} />
    </g>
  );
};

export type CleanerProps = {
  /** 0..1 across the cleanup beat: walks on, stoops, and carries it off. */
  progress: number;
};

export const Cleaner = ({ progress }: CleanerProps): JSX.Element => {
  const stooping = progress > 0.45;

  return (
    <g>
      <rect x={-13} y={16} width={26} height={42} rx={9} fill={PALETTE.cleanerShirt} />
      <g transform="translate(0, -6)">
        <circle cx={0} cy={0} r={15} fill={PALETTE.skin} />
        <path d="M -15 -2 A 15 15 0 0 1 15 -2 L 15 -12 A 15 15 0 0 0 -15 -12 Z" fill="#7c2d12" />
        <circle cx={-5} cy={0} r={2} fill="#1f2937" />
        <circle cx={5} cy={0} r={2} fill="#1f2937" />
      </g>
      <g transform={stooping ? "rotate(75, -10, 24)" : "rotate(15, -10, 24)"}>
        <rect x={-19} y={18} width={9} height={26} rx={4.5} fill={PALETTE.skin} />
      </g>
    </g>
  );
};

export type EatingTimerProps = {
  /** 0..1 through the eating beat. */
  progress: number;
  radius: number;
};

/**
 * DESIGN.md §109: the timer is the most visually dominant element during EATING. That dominance is
 * what the throw has to hand off FROM, so the lab draws a real one rather than implying it.
 */
export const EatingTimer = ({ progress, radius }: EatingTimerProps): JSX.Element => {
  const circumference = 2 * Math.PI * radius;
  const remaining = Math.max(0, 1 - progress);

  return (
    <g>
      <circle cx={0} cy={0} r={radius} fill="none" stroke="#334155" strokeWidth={radius * 0.18} />
      <circle
        cx={0}
        cy={0}
        r={radius}
        fill="none"
        stroke="#f97316"
        strokeWidth={radius * 0.18}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - remaining)}
        transform="rotate(-90)"
      />
    </g>
  );
};

export const Floor = ({ width, y }: { width: number; y: number }): JSX.Element => {
  return <rect x={0} y={y} width={width} height={8} rx={4} fill={PALETTE.floor} />;
};
