export type PathKind = "ufficiale" | "scorciatoia" | "ibrido";
export type PathPoint = { x: number; y: number };
export type Wall = { x1: number; y1: number; x2: number; y2: number };

const COLUMNS = 7;
const ROWS = 9;
const LEFT = 12;
const TOP = 12;
const CELL_WIDTH = 48;
const CELL_HEIGHT = 46;
const RIGHT = LEFT + COLUMNS * CELL_WIDTH;
const BOTTOM = TOP + ROWS * CELL_HEIGHT;

const cellIndex = (column:number, row:number) => row * COLUMNS + column;
const cellKey = (column:number, row:number) => `${column}:${row}`;
const cellCenter = (column:number, row:number): PathPoint => ({
  x:LEFT + column * CELL_WIDTH + CELL_WIDTH / 2,
  y:TOP + row * CELL_HEIGHT + CELL_HEIGHT / 2,
});

type Neighbor = { column:number; row:number };

const createMaze = () => {
  let seed = 1977;
  const random = () => {
    seed = (seed * 48271) % 2147483647;
    return seed / 2147483647;
  };
  const links = Array.from({ length:COLUMNS * ROWS }, () => new Set<string>());
  const visited = new Set([cellKey(0, 0)]);
  const stack: Neighbor[] = [{ column:0, row:0 }];
  const directions = [
    { dc:1, dr:0 },
    { dc:0, dr:1 },
    { dc:-1, dr:0 },
    { dc:0, dr:-1 },
  ];

  while (stack.length) {
    const current = stack.at(-1)!;
    const candidates = directions
      .map(({ dc, dr }) => ({ column:current.column + dc, row:current.row + dr }))
      .filter(({ column, row }) => (
        column >= 0 && column < COLUMNS
        && row >= 0 && row < ROWS
        && !visited.has(cellKey(column, row))
      ));

    if (!candidates.length) {
      stack.pop();
      continue;
    }

    const next = candidates[Math.floor(random() * candidates.length)];
    links[cellIndex(current.column, current.row)].add(cellKey(next.column, next.row));
    links[cellIndex(next.column, next.row)].add(cellKey(current.column, current.row));
    visited.add(cellKey(next.column, next.row));
    stack.push(next);
  }

  return links;
};

const LINKS = createMaze();
const linked = (column:number, row:number, otherColumn:number, otherRow:number) => (
  LINKS[cellIndex(column, row)].has(cellKey(otherColumn, otherRow))
);

const createWalls = () => {
  const walls: Wall[] = [];

  for (let column = 0; column < COLUMNS; column += 1) {
    const x1 = LEFT + column * CELL_WIDTH;
    const x2 = x1 + CELL_WIDTH;
    walls.push({ x1, y1:TOP, x2, y2:TOP });
    if (column !== COLUMNS - 1) walls.push({ x1, y1:BOTTOM, x2, y2:BOTTOM });
  }

  for (let row = 0; row < ROWS; row += 1) {
    const y1 = TOP + row * CELL_HEIGHT;
    const y2 = y1 + CELL_HEIGHT;
    if (row !== 0) walls.push({ x1:LEFT, y1, x2:LEFT, y2 });
    walls.push({ x1:RIGHT, y1, x2:RIGHT, y2 });
  }

  for (let row = 0; row < ROWS; row += 1) {
    for (let column = 0; column < COLUMNS - 1; column += 1) {
      if (linked(column, row, column + 1, row)) continue;
      const x = LEFT + (column + 1) * CELL_WIDTH;
      const y1 = TOP + row * CELL_HEIGHT;
      walls.push({ x1:x, y1, x2:x, y2:y1 + CELL_HEIGHT });
    }
  }

  for (let row = 0; row < ROWS - 1; row += 1) {
    for (let column = 0; column < COLUMNS; column += 1) {
      if (linked(column, row, column, row + 1)) continue;
      const x1 = LEFT + column * CELL_WIDTH;
      const y = TOP + (row + 1) * CELL_HEIGHT;
      walls.push({ x1, y1:y, x2:x1 + CELL_WIDTH, y2:y });
    }
  }

  return walls;
};

const findCellRoute = () => {
  const target = cellKey(COLUMNS - 1, ROWS - 1);
  const queue: Neighbor[] = [{ column:0, row:0 }];
  const previous = new Map<string, string | null>([[cellKey(0, 0), null]]);

  while (queue.length) {
    const current = queue.shift()!;
    const currentKey = cellKey(current.column, current.row);
    if (currentKey === target) break;
    const neighbors = [
      { column:current.column + 1, row:current.row },
      { column:current.column, row:current.row + 1 },
      { column:current.column - 1, row:current.row },
      { column:current.column, row:current.row - 1 },
    ].filter(({ column, row }) => (
      column >= 0 && column < COLUMNS
      && row >= 0 && row < ROWS
      && linked(current.column, current.row, column, row)
    ));
    neighbors.forEach((neighbor) => {
      const key = cellKey(neighbor.column, neighbor.row);
      if (previous.has(key)) return;
      previous.set(key, currentKey);
      queue.push(neighbor);
    });
  }

  if (!previous.has(target)) return [];
  const route: Neighbor[] = [];
  let cursor: string | null = target;
  while (cursor) {
    const [column, row] = cursor.split(":").map(Number);
    route.push({ column, row });
    cursor = previous.get(cursor) ?? null;
  }
  return route.reverse();
};

const CELL_ROUTE = findCellRoute();

export const START = { x:24, y:35 };
export const FINISH = { x:324, y:420 };
export const WALLS = createWalls();
export const MAZE_REACHABLE = CELL_ROUTE.length > 0;
export const MAZE_SOLUTION: PathPoint[] = [
  START,
  ...CELL_ROUTE.map(({ column, row }) => cellCenter(column, row)),
  FINISH,
];

if (!MAZE_REACHABLE) throw new Error("Il labirinto deterministico non collega ingresso e uscita.");

function orientation(a: PathPoint, b: PathPoint, c: PathPoint) {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function intersects(a: PathPoint, b: PathPoint, wall: Wall) {
  const c = { x:wall.x1, y:wall.y1 };
  const d = { x:wall.x2, y:wall.y2 };
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
