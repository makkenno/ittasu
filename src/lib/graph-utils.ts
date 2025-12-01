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
  existingNodes: { position: Position; width?: number | null; height?: number | null }[],
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
