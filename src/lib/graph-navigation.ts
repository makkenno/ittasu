import type { TaskEdge } from "../types/edge";
import type { TaskNode } from "../types/task";

export type NavigationDirection = "h" | "j" | "k" | "l";

export type Movable =
  | { type: "node"; id: string; position: { x: number; y: number } }
  | { type: "edge"; id: string; position: { x: number; y: number } };

export function buildMovables(nodes: TaskNode[], edges: TaskEdge[]): Movable[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const result: Movable[] = nodes.map((n) => ({
    type: "node",
    id: n.id,
    position: n.position,
  }));

  for (const edge of edges) {
    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);
    if (!source || !target) continue;

    result.push({
      type: "edge",
      id: edge.id,
      position: {
        x: (source.position.x + target.position.x) / 2,
        y: (source.position.y + target.position.y) / 2,
      },
    });
  }

  return result;
}

export function scoreDirection(
  dx: number,
  dy: number,
  direction: NavigationDirection,
): number | null {
  switch (direction) {
    case "l":
      if (dx <= 0) return null;
      return dx + Math.abs(dy) * 2;
    case "h":
      if (dx >= 0) return null;
      return -dx + Math.abs(dy) * 2;
    case "j":
      if (dy <= 0) return null;
      return dy + Math.abs(dx) * 2;
    case "k":
      if (dy >= 0) return null;
      return -dy + Math.abs(dx) * 2;
  }
}

export function findNearestMovable(
  current: Movable,
  candidates: Movable[],
  direction: NavigationDirection,
): Movable | null {
  let best: { item: Movable; score: number } | null = null;

  for (const candidate of candidates) {
    if (candidate.type === current.type && candidate.id === current.id) {
      continue;
    }

    const dx = candidate.position.x - current.position.x;
    const dy = candidate.position.y - current.position.y;
    const score = scoreDirection(dx, dy, direction);
    if (score === null) continue;
    if (!best || score < best.score) {
      best = { item: candidate, score };
    }
  }

  return best?.item ?? null;
}

export function findNearestNode(
  current: Movable,
  candidates: Movable[],
  direction: NavigationDirection,
): Movable | null {
  return findNearestMovable(
    current,
    candidates.filter((candidate) => candidate.type === "node"),
    direction,
  );
}
