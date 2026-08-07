import assert from "node:assert/strict";
import test from "node:test";

import { resolveSilhouette } from "../silhouettes";
import {
  angularErrorRadians,
  antipodeOf,
  buildAnamorphCloud,
  projectCloud,
  resolvesAntipodally,
  type ProjectionModel,
  type ProjectionSettings,
  type ViewAngle
} from "./index";

const SILHOUETTE = resolveSilhouette("bat");

const buildCloud = (seed = 20260807, pointCount = 400) => {
  return buildAnamorphCloud({ silhouette: SILHOUETTE, seed, pointCount });
};

const settingsOf = (overrides: Partial<ProjectionSettings> = {}): ProjectionSettings => {
  return { jitter: 0.6, curve: "linear", projection: "parallel", ...overrides };
};

const offsetBy = ({ yaw, pitch }: ViewAngle, degrees: number): ViewAngle => {
  return { yaw: yaw + (degrees * Math.PI) / 180, pitch };
};

// Mean distance between each projected point and where the silhouette says it
// should be — 0 is a perfect resolve, larger is soup.
const silhouetteError = (
  cloud: ReturnType<typeof buildCloud>,
  viewAngle: ViewAngle,
  settings: ProjectionSettings
): number => {
  const projected = projectCloud({ cloud, viewAngle, settings });
  const total = projected.reduce((sum, point, index) => {
    const source = cloud.points[index];

    return sum + Math.hypot(point.x - source.planeX, point.y - source.planeY);
  }, 0);

  return total / projected.length;
};

// Distance between each point and where the SAME cloud lands with the jitter
// knob at zero. This isolates the ray-jitter displacement from the plain
// foreshortening a flat plate shows at any off angle — foreshortening is not
// scramble, and only the jitter term is what the lab's knobs move.
const scrambleError = (
  cloud: ReturnType<typeof buildCloud>,
  viewAngle: ViewAngle,
  settings: ProjectionSettings
): number => {
  const jittered = projectCloud({ cloud, viewAngle, settings });
  const flat = projectCloud({ cloud, viewAngle, settings: { ...settings, jitter: 0 } });
  const total = jittered.reduce((sum, point, index) => {
    return sum + Math.hypot(point.x - flat[index].x, point.y - flat[index].y);
  }, 0);

  return total / jittered.length;
};

const PROJECTION_MODELS: readonly ProjectionModel[] = ["parallel", "eyeRay"];

for (const projection of PROJECTION_MODELS) {
  test(`resolves the exact silhouette at the true angle when projection is ${projection}`, () => {
    const cloud = buildCloud();

    assert.ok(
      silhouetteError(cloud, cloud.trueAngle, settingsOf({ projection })) < 1e-9,
      "the true angle must reproduce the silhouette exactly"
    );
  });

  test(`scrambles the silhouette well off the true angle when projection is ${projection}`, () => {
    const cloud = buildCloud();
    const error = scrambleError(cloud, offsetBy(cloud.trueAngle, 60), settingsOf({ projection }));

    assert.ok(error > 0.1, `expected soup 60 degrees off-angle, got mean error ${error}`);
  });
}

// Solves the 2x2 system that maps silhouette-plane coordinates onto projected
// ones, so a zero-jitter cloud can be shown to be a pure squash of the shape.
const fitLinearMap = (
  cloud: ReturnType<typeof buildCloud>,
  projected: readonly { x: number; y: number }[]
): { e1: { x: number; y: number }; e2: { x: number; y: number } } => {
  for (let i = 0; i < cloud.points.length; i += 1) {
    for (let j = i + 1; j < cloud.points.length; j += 1) {
      const a = cloud.points[i];
      const b = cloud.points[j];
      const det = a.planeX * b.planeY - a.planeY * b.planeX;

      if (Math.abs(det) < 0.2) {
        continue;
      }

      return {
        e1: {
          x: (b.planeY * projected[i].x - a.planeY * projected[j].x) / det,
          y: (b.planeY * projected[i].y - a.planeY * projected[j].y) / det
        },
        e2: {
          x: (a.planeX * projected[j].x - b.planeX * projected[i].x) / det,
          y: (a.planeX * projected[j].y - b.planeX * projected[i].y) / det
        }
      };
    }
  }

  throw new Error("no linearly independent pair of silhouette samples");
};

test("shows only a squashed silhouette from any angle when the jitter knob is at zero", () => {
  const cloud = buildCloud();
  const viewAngle = offsetBy(cloud.trueAngle, 75);
  const projected = projectCloud({
    cloud,
    viewAngle,
    settings: settingsOf({ jitter: 0, projection: "parallel" })
  });
  const { e1, e2 } = fitLinearMap(cloud, projected);
  const residual =
    projected.reduce((sum, point, index) => {
      const source = cloud.points[index];

      return (
        sum +
        Math.hypot(
          point.x - (source.planeX * e1.x + source.planeY * e2.x),
          point.y - (source.planeX * e1.y + source.planeY * e2.y)
        )
      );
    }, 0) / projected.length;

  // A flat plate projects as an affine image of itself, so the shape stays
  // readable everywhere — the "too little jitter is trivial" end of the band.
  assert.ok(residual < 1e-9, `expected a pure affine squash, got residual ${residual}`);
});

test("spreads the cloud further as the jitter knob rises", () => {
  const cloud = buildCloud();
  const viewAngle = offsetBy(cloud.trueAngle, 30);
  const gentle = scrambleError(cloud, viewAngle, settingsOf({ jitter: 0.2 }));
  const harsh = scrambleError(cloud, viewAngle, settingsOf({ jitter: 1.2 }));

  assert.ok(harsh > gentle * 4, `expected jitter to dominate, got ${gentle} then ${harsh}`);
});

test("reproduces the identical cloud and hidden angle when the seed is unchanged", () => {
  const first = buildCloud(4242);
  const second = buildCloud(4242);

  assert.deepEqual(second.points, first.points);
  assert.deepEqual(second.trueAngle, first.trueAngle);
});

test("produces a different cloud when the seed changes", () => {
  assert.notDeepEqual(buildCloud(4242).points, buildCloud(4243).points);
});

test("keeps the hidden angle stable when only the point count changes", () => {
  assert.deepEqual(buildCloud(99, 200).trueAngle, buildCloud(99, 900).trueAngle);
});

test("mirrors the silhouette at the antipodal angle when jitter is parallel", () => {
  const cloud = buildCloud();
  const projected = projectCloud({
    cloud,
    viewAngle: antipodeOf(cloud.trueAngle),
    settings: settingsOf({ projection: "parallel" })
  });
  const mirroredError =
    projected.reduce((sum, point, index) => {
      const source = cloud.points[index];

      return sum + Math.hypot(Math.abs(point.x) - Math.abs(source.planeX), point.y - source.planeY);
    }, 0) / projected.length;

  assert.ok(resolvesAntipodally("parallel"));
  assert.ok(mirroredError < 1e-9, `expected a clean mirror, got mean error ${mirroredError}`);
});

test("does not resolve at the antipodal angle when jitter runs along eye rays", () => {
  const cloud = buildCloud();
  const projected = projectCloud({
    cloud,
    viewAngle: antipodeOf(cloud.trueAngle),
    settings: settingsOf({ projection: "eyeRay" })
  });
  const mirroredError =
    projected.reduce((sum, point, index) => {
      const source = cloud.points[index];

      return sum + Math.hypot(Math.abs(point.x) - Math.abs(source.planeX), point.y - source.planeY);
    }, 0) / projected.length;

  assert.equal(resolvesAntipodally("eyeRay"), false);
  assert.ok(mirroredError > 0.1, `expected the mirror to stay broken, got ${mirroredError}`);
});

test("holds the cloud more scrambled than the linear ramp inside the snap window", () => {
  const cloud = buildCloud();
  const viewAngle = offsetBy(cloud.trueAngle, 8);
  const linear = scrambleError(cloud, viewAngle, settingsOf({ curve: "linear" }));
  const snap = scrambleError(cloud, viewAngle, settingsOf({ curve: "snap" }));

  assert.ok(snap > linear * 1.5, `expected a late snap, got linear ${linear} then snap ${snap}`);
});

test("matches the linear ramp outside the snap window", () => {
  const cloud = buildCloud();
  const viewAngle = offsetBy(cloud.trueAngle, 45);
  const linear = scrambleError(cloud, viewAngle, settingsOf({ curve: "linear" }));
  const snap = scrambleError(cloud, viewAngle, settingsOf({ curve: "snap" }));

  assert.equal(snap, linear);
});

test("still resolves exactly at the true angle when the curve is snap", () => {
  const cloud = buildCloud();

  assert.ok(silhouetteError(cloud, cloud.trueAngle, settingsOf({ curve: "snap" })) < 1e-9);
});

test("reports zero angular error against the true angle and grows with offset", () => {
  const cloud = buildCloud();

  assert.ok(angularErrorRadians(cloud.trueAngle, cloud.trueAngle) < 1e-12);
  assert.ok(
    angularErrorRadians(cloud.trueAngle, offsetBy(cloud.trueAngle, 30)) >
      angularErrorRadians(cloud.trueAngle, offsetBy(cloud.trueAngle, 10))
  );
});

test("samples every point inside the requested silhouette", () => {
  const cloud = buildAnamorphCloud({
    silhouette: resolveSilhouette("star"),
    seed: 7,
    pointCount: 300
  });

  assert.equal(cloud.points.length, 300);
  // A star's inner radius is 0.42, so no sample may sit at the bounding corner.
  assert.ok(cloud.points.every((point) => Math.hypot(point.planeX, point.planeY) <= 1.0001));
});
