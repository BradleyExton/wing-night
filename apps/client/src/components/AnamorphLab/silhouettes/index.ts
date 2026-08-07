// Lab silhouettes as plain polygons in [-1, 1]^2. WN-14 ships inline SVG path
// strings loaded through the content pipeline and rasterized to an offscreen
// canvas; polygons are used here on purpose so the sampler stays pure and the
// feel questions can be tested without a DOM. The shapes only have to be
// recognizable enough to judge emergence.

export type Silhouette = {
  id: string;
  label: string;
  polygon: readonly (readonly [number, number])[];
};

const mirrorRightHalf = (
  rightHalf: readonly (readonly [number, number])[]
): readonly (readonly [number, number])[] => {
  const mirrored = rightHalf
    .slice(1, -1)
    .reverse()
    .map(([x, y]): readonly [number, number] => [-x, y]);

  return [...rightHalf, ...mirrored];
};

// Right half only, top-centre down to bottom-centre; mirrored for the left.
const BAT_RIGHT_HALF: readonly (readonly [number, number])[] = [
  [0, 0.3],
  [0.1, 0.46],
  [0.2, 0.32],
  [0.31, 0.36],
  [0.43, 0.27],
  [0.58, 0.31],
  [0.73, 0.21],
  [0.88, 0.27],
  [1, 0.1],
  [0.86, 0.01],
  [0.72, -0.07],
  [0.62, -0.02],
  [0.52, -0.15],
  [0.4, -0.06],
  [0.3, -0.23],
  [0.18, -0.12],
  [0.1, -0.31],
  [0.04, -0.2],
  [0, -0.44]
];

const buildStar = (
  pointCount: number,
  outerRadius: number,
  innerRadius: number
): readonly (readonly [number, number])[] => {
  const vertices: (readonly [number, number])[] = [];

  for (let index = 0; index < pointCount * 2; index += 1) {
    const radius = index % 2 === 0 ? outerRadius : innerRadius;
    const angle = (index * Math.PI) / pointCount - Math.PI / 2;

    vertices.push([radius * Math.cos(angle), -radius * Math.sin(angle)]);
  }

  return vertices;
};

const buildHeart = (segmentCount: number): readonly (readonly [number, number])[] => {
  const vertices: (readonly [number, number])[] = [];

  for (let index = 0; index < segmentCount; index += 1) {
    const t = (index / segmentCount) * Math.PI * 2;
    const x = 16 * Math.sin(t) ** 3;
    const y =
      13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);

    vertices.push([x / 17, -y / 17]);
  }

  return vertices;
};

export const LAB_SILHOUETTES: readonly Silhouette[] = [
  { id: "bat", label: "Bat", polygon: mirrorRightHalf(BAT_RIGHT_HALF) },
  { id: "star", label: "Star", polygon: buildStar(5, 1, 0.42) },
  { id: "heart", label: "Heart", polygon: buildHeart(72) }
];

export const resolveSilhouette = (id: string): Silhouette => {
  return LAB_SILHOUETTES.find((silhouette) => silhouette.id === id) ?? LAB_SILHOUETTES[0];
};
