import dagre from "dagre";
import type { TaskEdge } from "../types/edge";
import type { TaskNode } from "../types/task";

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

  // Search to the right
  // We check with a smaller step to find the first available gap
  const stepSize = 50;
  for (let i = 0; i < 200; i++) {
    const pos = {
      x: center.x + i * stepSize,
      y: center.y,
    };

    if (!isOverlapping(pos)) {
      return pos;
    }
  }

  return center; // Fallback
};

export const getLayoutedElements = (
  nodes: TaskNode[],
  edges: TaskEdge[],
  nodeDimensions: Map<string, { width: number; height: number }> = new Map(),
  direction = "LR", // TB (top-bottom) or LR (left-right)
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
