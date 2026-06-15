import { useCallback } from "react";
import type { ReactFlowInstance } from "reactflow";
import {
  findEndNode,
  findFreePosition,
  findPredecessors,
  findStartNode,
  type GraphLayoutDirection,
} from "../../../../lib/graph-utils";
import type { TaskEdge } from "../../../../types/edge";
import type { TaskNode } from "../../../../types/task";

interface MeasuredNode {
  width?: number | null;
  height?: number | null;
}

type AddTask = (
  position?: { x: number; y: number },
  connectFromIds?: string[],
  connectToIds?: string[],
  removeEdgeIds?: string[],
) => string;

const getSequentialInsertPosition = (
  task: TaskNode,
  measuredNode: MeasuredNode | undefined,
  direction: GraphLayoutDirection,
  placement: "before" | "after",
) => {
  const sign = placement === "before" ? -1 : 1;
  if (direction === "TB") {
    return {
      x: task.position.x,
      y: task.position.y + sign * ((measuredNode?.height ?? 100) + 80),
    };
  }
  return {
    x: task.position.x + sign * ((measuredNode?.width ?? 250) + 80),
    y: task.position.y,
  };
};

const getSiblingInsertPosition = (
  task: TaskNode,
  measuredNode: MeasuredNode | undefined,
  direction: GraphLayoutDirection,
) => {
  if (direction === "TB") {
    return {
      x: task.position.x + (measuredNode?.width ?? 250) + 60,
      y: task.position.y,
    };
  }
  return {
    x: task.position.x,
    y: task.position.y + (measuredNode?.height ?? 100) + 60,
  };
};

export function useTaskInsertion({
  rfInstance,
  containerRef,
  taskNodes,
  taskEdges,
  selectedTask,
  parentId,
  layoutDirection,
  onAddTask,
  trackAddedTask,
}: {
  rfInstance: ReactFlowInstance | null;
  containerRef: React.RefObject<HTMLDivElement | null>;
  taskNodes: TaskNode[];
  taskEdges: TaskEdge[];
  selectedTask: TaskNode | null;
  parentId: string | null;
  layoutDirection: GraphLayoutDirection;
  onAddTask?: AddTask;
  trackAddedTask: (taskId: string, formatBeforeFocus: boolean) => void;
}) {
  const addUnconnectedTask = useCallback(
    (position?: { x: number; y: number }) => {
      const newId = onAddTask?.(position);
      if (newId) trackAddedTask(newId, false);
    },
    [onAddTask, trackAddedTask],
  );

  const addTaskAtViewCenter = useCallback(() => {
    if (rfInstance && containerRef.current) {
      const { top, left, width, height } =
        containerRef.current.getBoundingClientRect();
      const centerPosition = rfInstance.screenToFlowPosition({
        x: left + width / 2,
        y: top + height / 2,
      });
      const existingNodes = rfInstance.getNodes();
      const newPosition = findFreePosition(
        centerPosition,
        existingNodes,
        layoutDirection,
      );
      addUnconnectedTask(newPosition);
    } else {
      addUnconnectedTask();
    }
  }, [addUnconnectedTask, containerRef, layoutDirection, rfInstance]);

  const insertAtStart = useCallback(() => {
    if (!rfInstance) {
      onAddTask?.();
      return;
    }
    const start = findStartNode(
      taskNodes,
      taskEdges,
      parentId,
      layoutDirection,
    );
    if (!start) {
      addTaskAtViewCenter();
      return;
    }
    const existingNodes = rfInstance.getNodes();
    const startRf = existingNodes.find((node) => node.id === start.id);
    const base = getSequentialInsertPosition(
      start,
      startRf,
      layoutDirection,
      "before",
    );
    const newPosition = findFreePosition(base, existingNodes, layoutDirection);
    const newId = onAddTask?.(newPosition, [], [start.id], []);
    if (newId) trackAddedTask(newId, true);
  }, [
    addTaskAtViewCenter,
    layoutDirection,
    onAddTask,
    parentId,
    rfInstance,
    taskEdges,
    taskNodes,
    trackAddedTask,
  ]);

  const insertAtEnd = useCallback(() => {
    if (!rfInstance) {
      onAddTask?.();
      return;
    }
    const end = findEndNode(taskNodes, taskEdges, parentId, layoutDirection);
    if (!end) {
      addTaskAtViewCenter();
      return;
    }
    const existingNodes = rfInstance.getNodes();
    const endRf = existingNodes.find((node) => node.id === end.id);
    const base = getSequentialInsertPosition(
      end,
      endRf,
      layoutDirection,
      "after",
    );
    const newPosition = findFreePosition(base, existingNodes, layoutDirection);
    const newId = onAddTask?.(newPosition, [end.id], [], []);
    if (newId) trackAddedTask(newId, true);
  }, [
    addTaskAtViewCenter,
    layoutDirection,
    onAddTask,
    parentId,
    rfInstance,
    taskEdges,
    taskNodes,
    trackAddedTask,
  ]);

  const insertBeforeSelected = useCallback(() => {
    if (!rfInstance) {
      onAddTask?.();
      return;
    }
    if (!selectedTask) {
      insertAtStart();
      return;
    }
    const incomingEdges = taskEdges.filter(
      (edge) => edge.parentId === parentId && edge.target === selectedTask.id,
    );
    const existingNodes = rfInstance.getNodes();
    const targetRf = existingNodes.find((node) => node.id === selectedTask.id);
    const base = getSequentialInsertPosition(
      selectedTask,
      targetRf,
      layoutDirection,
      "before",
    );
    const newPosition = findFreePosition(base, existingNodes, layoutDirection);
    const newId = onAddTask?.(
      newPosition,
      incomingEdges.map((edge) => edge.source),
      [selectedTask.id],
      incomingEdges.map((edge) => edge.id),
    );
    if (newId) trackAddedTask(newId, true);
  }, [
    insertAtStart,
    layoutDirection,
    onAddTask,
    parentId,
    rfInstance,
    selectedTask,
    taskEdges,
    trackAddedTask,
  ]);

  const insertAfterSelected = useCallback(() => {
    if (!rfInstance) {
      onAddTask?.();
      return;
    }
    if (!selectedTask) {
      insertAtEnd();
      return;
    }
    const outgoingEdges = taskEdges.filter(
      (edge) => edge.parentId === parentId && edge.source === selectedTask.id,
    );
    const existingNodes = rfInstance.getNodes();
    const sourceRf = existingNodes.find((node) => node.id === selectedTask.id);
    const base = getSequentialInsertPosition(
      selectedTask,
      sourceRf,
      layoutDirection,
      "after",
    );
    const newPosition = findFreePosition(base, existingNodes, layoutDirection);
    const newId = onAddTask?.(
      newPosition,
      [selectedTask.id],
      outgoingEdges.map((edge) => edge.target),
      outgoingEdges.map((edge) => edge.id),
    );
    if (newId) trackAddedTask(newId, true);
  }, [
    insertAtEnd,
    layoutDirection,
    onAddTask,
    parentId,
    rfInstance,
    selectedTask,
    taskEdges,
    trackAddedTask,
  ]);

  const addSibling = useCallback(() => {
    if (!rfInstance) {
      onAddTask?.();
      return;
    }
    const reference =
      selectedTask ??
      findEndNode(taskNodes, taskEdges, parentId, layoutDirection);
    if (!reference) {
      addTaskAtViewCenter();
      return;
    }
    const predecessors = findPredecessors(reference.id, taskEdges, parentId);
    const existingNodes = rfInstance.getNodes();
    const referenceRf = existingNodes.find((node) => node.id === reference.id);
    const base = getSiblingInsertPosition(
      reference,
      referenceRf,
      layoutDirection,
    );
    const newPosition = findFreePosition(
      base,
      existingNodes,
      layoutDirection === "TB" ? "LR" : "TB",
    );
    const newId = onAddTask?.(newPosition, predecessors);
    if (newId) trackAddedTask(newId, predecessors.length > 0);
  }, [
    addTaskAtViewCenter,
    layoutDirection,
    onAddTask,
    parentId,
    rfInstance,
    selectedTask,
    taskEdges,
    taskNodes,
    trackAddedTask,
  ]);

  return {
    addTaskAtViewCenter,
    addUnconnectedTask,
    insertAtStart,
    insertAtEnd,
    insertBeforeSelected,
    insertAfterSelected,
    addSibling,
  };
}
