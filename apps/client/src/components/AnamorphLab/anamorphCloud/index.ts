// Pure anamorphic-projection core for the WN-16 feel lab. No DOM, no canvas, no
// randomness beyond the caller's seed — so the whole model is unit-testable and
// two people driving the lab with the same seed compare the identical object.
//
// Construction: sample the silhouette in the target camera's image plane, then
// push each point along its own view ray. From the target angle the ray offset
// is invisible (it lies along the line of sight) and the silhouette is exact;
// from anywhere else it is soup. WN-14 ports the numbers, not this file.

import type { Silhouette } from "../silhouettes";

export type LegibilityCurve = "linear" | "snap";

// Which ray the jitter runs along — and, as a direct consequence, whether the
// antipodal angle also resolves. See resolvesAntipodally() below.
export type ProjectionModel = "parallel" | "eyeRay";

export type ViewAngle = {
  yaw: number;
  pitch: number;
};

export type CloudPoint = {
  // Silhouette-plane coordinates in [-1, 1], as seen from the true angle.
  planeX: number;
  planeY: number;
  // Signed distance along this point's own view ray, in [-1, 1]. Scaled by the
  // caller's jitter knob at projection time so the slider is live.
  rayOffset: number;
};

export type AnamorphCloud = {
  points: CloudPoint[];
  trueAngle: ViewAngle;
};

// Screen-plane coordinates only. Deliberately no depth channel: shading dots by
// distance would leak the cloud's 3D structure and hand the team the illusion
// the puzzle is asking them to find. Uniform dots are the anamorph presentation.
export type ProjectedPoint = {
  x: number;
  y: number;
};

export type ProjectionSettings = {
  jitter: number;
  curve: LegibilityCurve;
  projection: ProjectionModel;
};

// Angular half-width of the "snap" curve's collapse. Outside it the two curves
// are identical; inside it `snap` holds the cloud scrambled and then collapses.
const SNAP_WINDOW_RADIANS = (25 * Math.PI) / 180;

// Exponent < 1 makes the shaped error decay slower than the true error inside
// the window, which is what reads as "flat, then a hard snap at the end".
const SNAP_SHAPE_EXPONENT = 0.4;

// Without a cap the gain diverges as the error goes to zero. The displacement
// it multiplies goes to zero faster, so the cap only bounds arithmetic.
const SNAP_GAIN_CAP = 12;

const EYE_DISTANCE = 3.2;

// An eye-ray point must stay in front of the eye or the perspective divide
// flips it behind the camera.
const MIN_RAY_PARAMETER = 0.15;

const mulberry32 = (seed: number): (() => number) => {
  let state = seed >>> 0;

  return (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let drawn = Math.imul(state ^ (state >>> 15), 1 | state);
    drawn = (drawn + Math.imul(drawn ^ (drawn >>> 7), 61 | drawn)) ^ drawn;

    return ((drawn ^ (drawn >>> 14)) >>> 0) / 4294967296;
  };
};

const isInsidePolygon = (
  polygon: readonly (readonly [number, number])[],
  x: number,
  y: number
): boolean => {
  let inside = false;

  for (
    let current = 0, previous = polygon.length - 1;
    current < polygon.length;
    previous = current++
  ) {
    const [currentX, currentY] = polygon[current];
    const [previousX, previousY] = polygon[previous];
    const straddlesRay = currentY > y !== previousY > y;

    if (!straddlesRay) {
      continue;
    }

    const crossingX =
      ((previousX - currentX) * (y - currentY)) / (previousY - currentY) + currentX;

    if (x < crossingX) {
      inside = !inside;
    }
  }

  return inside;
};

export type BuildAnamorphCloudInput = {
  silhouette: Silhouette;
  seed: number;
  pointCount: number;
};

export const buildAnamorphCloud = ({
  silhouette,
  seed,
  pointCount
}: BuildAnamorphCloudInput): AnamorphCloud => {
  const nextRandom = mulberry32(seed);
  // Drawn before the points so the hidden angle is a pure function of the seed
  // and does not shift when the point count changes.
  const trueAngle: ViewAngle = {
    yaw: (nextRandom() * 2 - 1) * Math.PI,
    pitch: (nextRandom() * 2 - 1) * (Math.PI / 3)
  };
  const points: CloudPoint[] = [];
  // Rejection sampling terminates on any non-degenerate polygon; the bound is a
  // guard against a caller passing one with no interior, not a tuning knob.
  const maximumAttempts = pointCount * 200;
  let attempts = 0;

  while (points.length < pointCount && attempts < maximumAttempts) {
    attempts += 1;
    const planeX = nextRandom() * 2 - 1;
    const planeY = nextRandom() * 2 - 1;

    if (!isInsidePolygon(silhouette.polygon, planeX, planeY)) {
      continue;
    }

    points.push({ planeX, planeY, rayOffset: nextRandom() * 2 - 1 });
  }

  return { points, trueAngle };
};

const rotateCameraToWorld = (
  point: { x: number; y: number; z: number },
  { yaw, pitch }: ViewAngle
): { x: number; y: number; z: number } => {
  const cosPitch = Math.cos(pitch);
  const sinPitch = Math.sin(pitch);
  const pitchedY = point.y * cosPitch + point.z * sinPitch;
  const pitchedZ = -point.y * sinPitch + point.z * cosPitch;
  const cosYaw = Math.cos(yaw);
  const sinYaw = Math.sin(yaw);

  return {
    x: point.x * cosYaw - pitchedZ * sinYaw,
    y: pitchedY,
    z: point.x * sinYaw + pitchedZ * cosYaw
  };
};

const rotateWorldToCamera = (
  point: { x: number; y: number; z: number },
  { yaw, pitch }: ViewAngle
): { x: number; y: number; z: number } => {
  const cosYaw = Math.cos(yaw);
  const sinYaw = Math.sin(yaw);
  const yawedX = point.x * cosYaw + point.z * sinYaw;
  const yawedZ = -point.x * sinYaw + point.z * cosYaw;
  const cosPitch = Math.cos(pitch);
  const sinPitch = Math.sin(pitch);

  return {
    x: yawedX,
    y: point.y * cosPitch - yawedZ * sinPitch,
    z: point.y * sinPitch + yawedZ * cosPitch
  };
};

const viewDirection = (angle: ViewAngle): { x: number; y: number; z: number } => {
  return rotateCameraToWorld({ x: 0, y: 0, z: 1 }, angle);
};

export const angularErrorRadians = (a: ViewAngle, b: ViewAngle): number => {
  const first = viewDirection(a);
  const second = viewDirection(b);
  const dot = first.x * second.x + first.y * second.y + first.z * second.z;

  return Math.acos(Math.min(1, Math.max(-1, dot)));
};

// `linear` is the untouched geometry: displacement falls off with the sine of
// the angular error, which is the natural hill-climbable ramp. `snap` reshapes
// the effective error inside the window so the cloud stays scrambled and then
// collapses late. Both are exact at zero error.
const jitterGain = (curve: LegibilityCurve, errorRadians: number): number => {
  if (curve === "linear" || errorRadians >= SNAP_WINDOW_RADIANS || errorRadians <= 0) {
    return 1;
  }

  const shapedError =
    SNAP_WINDOW_RADIANS *
    Math.pow(errorRadians / SNAP_WINDOW_RADIANS, SNAP_SHAPE_EXPONENT);

  return Math.min(SNAP_GAIN_CAP, shapedError / errorRadians);
};

const toTargetCameraSpace = (
  point: CloudPoint,
  offset: number,
  projection: ProjectionModel
): { x: number; y: number; z: number } => {
  if (projection === "parallel") {
    return { x: point.planeX, y: point.planeY, z: offset };
  }

  // Slide along the ray from the eye through the image-plane point. Every such
  // point projects back to (planeX, planeY) under the perspective divide.
  const rayParameter = Math.max(MIN_RAY_PARAMETER, 1 + offset);

  return {
    x: rayParameter * point.planeX,
    y: rayParameter * point.planeY,
    z: EYE_DISTANCE * (1 - rayParameter)
  };
};

export type ProjectCloudInput = {
  cloud: AnamorphCloud;
  viewAngle: ViewAngle;
  settings: ProjectionSettings;
};

export const projectCloud = ({
  cloud,
  viewAngle,
  settings
}: ProjectCloudInput): ProjectedPoint[] => {
  const gain = jitterGain(settings.curve, angularErrorRadians(viewAngle, cloud.trueAngle));
  const scaledJitter = settings.jitter * gain;

  return cloud.points.map((point) => {
    const targetSpace = toTargetCameraSpace(
      point,
      point.rayOffset * scaledJitter,
      settings.projection
    );
    const world = rotateCameraToWorld(targetSpace, cloud.trueAngle);
    const camera = rotateWorldToCamera(world, viewAngle);

    if (settings.projection === "parallel") {
      return { x: camera.x, y: camera.y };
    }

    const eyeToPoint = Math.max(MIN_RAY_PARAMETER, EYE_DISTANCE - camera.z);
    const scale = EYE_DISTANCE / eyeToPoint;

    return { x: camera.x * scale, y: camera.y * scale };
  });
};

// The 180° question, stated as a property of the projection model rather than a
// tunable: a parallel projection drops depth entirely, so the antipodal angle
// reproduces the silhouette mirrored. Eye-ray jitter fans out from behind and
// does not resolve. This is why the lab's mirror toggle switches the model.
export const resolvesAntipodally = (projection: ProjectionModel): boolean => {
  return projection === "parallel";
};

export const antipodeOf = ({ yaw, pitch }: ViewAngle): ViewAngle => {
  return { yaw: yaw + Math.PI, pitch: -pitch };
};

// Stopping just short of the poles keeps both control idioms from flipping the
// cloud over the top, which reads as a glitch rather than a rotation.
const MAX_PITCH = Math.PI / 2 - 0.01;

export const clampPitch = (pitch: number): number => {
  return Math.min(MAX_PITCH, Math.max(-MAX_PITCH, pitch));
};
