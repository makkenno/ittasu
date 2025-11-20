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
