import type { TaskEdge } from "../types/edge";
import type { TaskNode } from "../types/task";

export const findNextTask = (
  nodes: TaskNode[],
  edges: TaskEdge[],
): string | null => {
  let currentParentId: string | null = null;

  while (true) {
    const currentLevelTasks = nodes.filter(
      (node) => node.parentId === currentParentId,
    );

    const incompleteTasks = currentLevelTasks.filter((node) => !node.completed);

    if (incompleteTasks.length === 0) {
      return currentParentId;
    }

    const readyTasks = incompleteTasks.filter((task) => {
      const incomingEdges = edges.filter((edge) => edge.target === task.id);
      const allDependenciesMet = incomingEdges.every((edge) => {
        const sourceNode = nodes.find((n) => n.id === edge.source);
        if (!sourceNode) return true;
        return sourceNode.completed;
      });
      return allDependenciesMet;
    });

    const candidates = readyTasks.length > 0 ? readyTasks : incompleteTasks;

    candidates.sort((a, b) => {
      if (a.position.y !== b.position.y) {
        return a.position.y - b.position.y;
      }
      return a.position.x - b.position.x;
    });

    const nextTask = candidates[0];
    if (!nextTask) return null;

    const hasChildren = nodes.some((node) => node.parentId === nextTask.id);

    if (hasChildren) {
      currentParentId = nextTask.id;
    } else {
      return nextTask.id;
    }
  }
};
