export type PathKind = "ufficiale" | "scorciatoia" | "ibrido";

export function classifyPath(points: Array<{ x: number; y: number }>): PathKind {
  if (points.length < 2) return "ibrido";
  let length = 0;
  for (let i = 1; i < points.length; i += 1) {
    length += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  const direct = Math.hypot(points.at(-1)!.x - points[0].x, points.at(-1)!.y - points[0].y);
  const ratio = direct / Math.max(length, 1);
  if (ratio > .78) return "scorciatoia";
  if (ratio < .48) return "ufficiale";
  return "ibrido";
}
