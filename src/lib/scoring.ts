export function compareLowerIsBetter(
  left: { complete: boolean; primary: number; time: number },
  right: { complete: boolean; primary: number; time: number },
): number {
  if (left.complete !== right.complete) return left.complete ? -1 : 1;
  if (left.primary !== right.primary) return left.primary - right.primary;
  return left.time - right.time;
}

export function normalizeStrokes(points: Array<{ x: number; y: number }>, width: number, height: number) {
  if (width <= 0 || height <= 0 || points.length > 4000) return [];
  return points.map(({ x, y }) => ({
    x: Math.max(0, Math.min(1, x / width)),
    y: Math.max(0, Math.min(1, y / height)),
  }));
}
