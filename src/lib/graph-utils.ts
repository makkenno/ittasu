import dagre from "dagre";
import type { TaskEdge } from "../types/edge";
import type { TaskNode } from "../types/task";

export type GraphLayoutDirection = "LR" | "TB";

export const getDescendantIds = (
  nodes: TaskNode[],
  rootId: string,
): Set<string> => {
  const descendants = new Set<string>();
  const collectDescendants = (id: string) => {
    descendants.add(id);
    const children = nodes.filter((node) => node.parentId === id);
    for (const child of children) {
      collectDescendants(child.id);
    }
  };
  collectDescendants(rootId);
  return descendants;
};

interface ConnectionStat {
  incoming: number;
  outgoing: number;
}

const computeConnectionStats = (
  currentNodes: TaskNode[],
  edges: TaskEdge[],
  parentId: string | null,
): Map<string, ConnectionStat> => {
  const stats = new Map<string, ConnectionStat>();
  for (const node of currentNodes) {
    stats.set(node.id, { incoming: 0, outgoing: 0 });
  }
  for (const edge of edges) {
    if (edge.parentId !== parentId) continue;
    const sourceStat = stats.get(edge.source);
    const targetStat = stats.get(edge.target);
    if (!sourceStat || !targetStat) continue;
    sourceStat.outgoing++;
    targetStat.incoming++;
  }
  return stats;
};

export const analyzeConnectionsInScope = (
  currentNodes: TaskNode[],
  edges: TaskEdge[],
  parentId: string | null,
): { isolated: TaskNode[]; tails: TaskNode[] } => {
  const stats = computeConnectionStats(currentNodes, edges, parentId);
  const isolated = currentNodes.filter((node) => {
    const s = stats.get(node.id);
    return s !== undefined && s.incoming === 0 && s.outgoing === 0;
  });
  const tails = currentNodes.filter((node) => {
    const s = stats.get(node.id);
    return s !== undefined && s.incoming > 0 && s.outgoing === 0;
  });
  return { isolated, tails };
};

interface Position {
  x: number;
  y: number;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const findFreePosition = (
  center: Position,
  existingNodes: {
    position: Position;
    width?: number | null;
    height?: number | null;
  }[],
  direction: GraphLayoutDirection = "LR",
  nodeWidth = 200,
  nodeHeight = 100,
  spacing = 20,
): Position => {
  const isOverlapping = (pos: Position) => {
    const newRect: Rect = {
      x: pos.x,
      y: pos.y,
      width: nodeWidth,
      height: nodeHeight,
    };

    return existingNodes.some((node) => {
      const nodeW = node.width || nodeWidth;
      const nodeH = node.height || nodeHeight;
      const nodeRect: Rect = {
        x: node.position.x,
        y: node.position.y,
        width: nodeW,
        height: nodeH,
      };

      return (
        newRect.x < nodeRect.x + nodeRect.width + spacing &&
        newRect.x + newRect.width + spacing > nodeRect.x &&
        newRect.y < nodeRect.y + nodeRect.height + spacing &&
        newRect.y + newRect.height + spacing > nodeRect.y
      );
    });
  };

  const stepSize = 50;
  for (let i = 0; i < 200; i++) {
    const pos = {
      x: center.x + (direction === "LR" ? i * stepSize : 0),
      y: center.y + (direction === "TB" ? i * stepSize : 0),
    };

    if (!isOverlapping(pos)) {
      return pos;
    }
  }

  return center; // Fallback
};

export const findEndNode = (
  nodes: TaskNode[],
  edges: TaskEdge[],
  parentId: string | null,
  direction: GraphLayoutDirection = "LR",
): TaskNode | null => {
  if (nodes.length === 0) return null;
  const scopeEdges = edges.filter((e) => e.parentId === parentId);
  const hasOutgoing = new Set(scopeEdges.map((e) => e.source));
  const ends = nodes.filter((n) => !hasOutgoing.has(n.id));
  const pool = ends.length > 0 ? ends : nodes;
  return (
    [...pool].sort((a, b) => {
      if (direction === "TB") {
        if (a.position.y !== b.position.y) return b.position.y - a.position.y;
        return b.position.x - a.position.x;
      }
      if (a.position.x !== b.position.x) return b.position.x - a.position.x;
      return b.position.y - a.position.y;
    })[0] ?? null
  );
};

export const findStartNode = (
  nodes: TaskNode[],
  edges: TaskEdge[],
  parentId: string | null,
  direction: GraphLayoutDirection = "LR",
): TaskNode | null => {
  if (nodes.length === 0) return null;
  const scopeEdges = edges.filter((e) => e.parentId === parentId);
  const hasIncoming = new Set(scopeEdges.map((e) => e.target));
  const starts = nodes.filter((n) => !hasIncoming.has(n.id));
  const pool = starts.length > 0 ? starts : nodes;
  return (
    [...pool].sort((a, b) => {
      if (direction === "TB") {
        if (a.position.y !== b.position.y) return a.position.y - b.position.y;
        return a.position.x - b.position.x;
      }
      if (a.position.x !== b.position.x) return a.position.x - b.position.x;
      return a.position.y - b.position.y;
    })[0] ?? null
  );
};

export const findPredecessors = (
  nodeId: string,
  edges: TaskEdge[],
  parentId: string | null,
): string[] => {
  return edges
    .filter((e) => e.parentId === parentId && e.target === nodeId)
    .map((e) => e.source);
};

const findOutgoingNeighbor = (
  deletedIds: Set<string>,
  scopeEdges: TaskEdge[],
  remainingIds: Set<string>,
): string | null => {
  for (const edge of scopeEdges) {
    if (deletedIds.has(edge.source) && remainingIds.has(edge.target)) {
      return edge.target;
    }
  }
  return null;
};

const findIncomingNeighbor = (
  deletedIds: Set<string>,
  scopeEdges: TaskEdge[],
  remainingIds: Set<string>,
): string | null => {
  for (const edge of scopeEdges) {
    if (deletedIds.has(edge.target) && remainingIds.has(edge.source)) {
      return edge.source;
    }
  }
  return null;
};

const findSpatiallyNearest = (
  reference: TaskNode,
  remaining: TaskNode[],
): string | null => {
  let best: { id: string; dist: number } | null = null;
  for (const n of remaining) {
    const dx = n.position.x - reference.position.x;
    const dy = n.position.y - reference.position.y;
    const dist = dx * dx + dy * dy;
    if (!best || dist < best.dist) {
      best = { id: n.id, dist };
    }
  }
  return best?.id ?? null;
};

export const findNextSelectionAfterDelete = (
  deletedIds: Set<string>,
  nodes: TaskNode[],
  edges: TaskEdge[],
  parentId: string | null,
): string | null => {
  if (deletedIds.size === 0) return null;
  const scopeNodes = nodes.filter((n) => n.parentId === parentId);
  const remaining = scopeNodes.filter((n) => !deletedIds.has(n.id));
  if (remaining.length === 0) return null;

  const reference = scopeNodes.find((n) => deletedIds.has(n.id));
  if (!reference) return remaining[0]?.id ?? null;

  const scopeEdges = edges.filter((e) => e.parentId === parentId);
  const remainingIds = new Set(remaining.map((n) => n.id));

  return (
    findOutgoingNeighbor(deletedIds, scopeEdges, remainingIds) ??
    findIncomingNeighbor(deletedIds, scopeEdges, remainingIds) ??
    findSpatiallyNearest(reference, remaining)
  );
};

export const getLayoutedElements = (
  nodes: TaskNode[],
  edges: TaskEdge[],
  nodeDimensions: Map<string, { width: number; height: number }> = new Map(),
  direction: GraphLayoutDirection = "LR",
) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const defaultWidth = 250;
  const defaultHeight = 100;

  dagreGraph.setGraph({ rankdir: direction });

  for (const node of nodes) {
    const dim = nodeDimensions.get(node.id);
    dagreGraph.setNode(node.id, {
      width: dim?.width || defaultWidth,
      height: dim?.height || defaultHeight,
    });
  }

  for (const edge of edges) {
    dagreGraph.setEdge(edge.source, edge.target);
  }

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const dim = nodeDimensions.get(node.id);
    const width = dim?.width || defaultWidth;
    const height = dim?.height || defaultHeight;

    return {
      ...node,
      position: {
        x: nodeWithPosition.x - width / 2,
        y: nodeWithPosition.y - height / 2,
      },
    };
  });

  return layoutedNodes;
};
