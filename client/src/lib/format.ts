export function formatCount(
  count: number,
  singular: string,
  plural: string = `${singular}s`
): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function formatPlayerCount(count: number): string {
  return formatCount(count, 'player');
}

export function formatPoints(count: number): string {
  return formatCount(count, 'point');
}
