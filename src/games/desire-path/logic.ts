export type PathKind = "ufficiale" | "scorciatoia" | "ibrido";
export type PathPoint = { x: number; y: number };
export type Wall = { x1: number; y1: number; x2: number; y2: number };

export const START = { x: 24, y: 24 };
export const FINISH = { x: 336, y: 416 };
export const WALLS: Wall[] = [
  { x1: 90, y1: 0, x2: 90, y2: 300 },
  { x1: 180, y1: 140, x2: 180, y2: 440 },
  { x1: 270, y1: 0, x2: 270, y2: 300 },
];

function orientation(a: PathPoint, b: PathPoint, c: PathPoint) {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function intersects(a: PathPoint, b: PathPoint, wall: Wall) {
  const c = { x: wall.x1, y: wall.y1 };
  const d = { x: wall.x2, y: wall.y2 };
  return orientation(a, b, c) * orientation(a, b, d) <= 0
    && orientation(c, d, a) * orientation(c, d, b) <= 0;
}

export function pathLength(points: PathPoint[]) {
  return points.slice(1).reduce((sum, point, index) => sum + Math.hypot(point.x - points[index].x, point.y - points[index].y), 0);
}

export function crossedWalls(points: PathPoint[]) {
  const crossed = new Set<number>();
  for (let index = 1; index < points.length; index += 1) {
    WALLS.forEach((wall, wallIndex) => {
      if (intersects(points[index - 1], points[index], wall)) crossed.add(wallIndex);
    });
  }
  return [...crossed];
}

export function analyzePath(points: PathPoint[]) {
  const length = pathLength(points);
  const direct = Math.hypot(FINISH.x - START.x, FINISH.y - START.y);
  const crossings = crossedWalls(points);
  const startValid = Boolean(points[0] && Math.hypot(points[0].x - START.x, points[0].y - START.y) <= 42);
  const endValid = Boolean(points.at(-1) && Math.hypot(points.at(-1)!.x - FINISH.x, points.at(-1)!.y - FINISH.y) <= 52);
  const efficiency = direct / Math.max(length, 1);
  const kind: PathKind = crossings.length === 0 && efficiency < .62
    ? "ufficiale"
    : crossings.length >= 2 && efficiency > .85
      ? "scorciatoia"
      : "ibrido";
  return { kind, length, efficiency, crossings, startValid, endValid };
}

export function classifyPath(points: PathPoint[]): PathKind {
  if (points.length < 2) return "ibrido";
  return analyzePath(points).kind;
}
