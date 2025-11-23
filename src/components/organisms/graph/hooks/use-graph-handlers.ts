import { useCallback, useState } from "react";
import {
  applyNodeChanges,
  type Node,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
} from "reactflow";
import type { TaskNode } from "../../../../types/task";
import type { TaskNodeData } from "../../../molecules/graph/task-node";

interface UseGraphHandlersProps {
  taskNodes: TaskNode[];
  reactFlowNodes: Node<TaskNodeData>[];
  onTaskNodesChange?: (nodes: TaskNode[]) => void;
  onRemoveTask?: (taskId: string) => void;
  onRemoveEdge?: (edgeId: string) => void;
  onAddEdge?: (source: string, target: string) => void;
}

export function useGraphHandlers({
  taskNodes,
  reactFlowNodes,
  onTaskNodesChange,
  onRemoveTask,
  onRemoveEdge,
  onAddEdge,
}: UseGraphHandlersProps) {
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<Set<string>>(
    new Set(),
  );

  const handleNodesChange: OnNodesChange = useCallback(
    (changes) => {
      for (const change of changes) {
        if (change.type === "remove") {
          onRemoveTask?.(change.id);
        }
      }

      const updatedNodes = applyNodeChanges(changes, reactFlowNodes);

      const newTaskNodes = taskNodes.map((task) => {
        const node = updatedNodes.find((n) => n.id === task.id);
        if (node) {
          return { ...task, position: node.position };
        }
        return task;
      });

      onTaskNodesChange?.(newTaskNodes);
    },
    [reactFlowNodes, taskNodes, onTaskNodesChange, onRemoveTask],
  );

  const handleEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      let hasSelectionChanges = false;
      const selectionChanges: { id: string; selected: boolean }[] = [];

      for (const change of changes) {
        if (change.type === "remove") {
          onRemoveEdge?.(change.id);
        }
        if (change.type === "select") {
          hasSelectionChanges = true;
          selectionChanges.push({ id: change.id, selected: change.selected });
        }
      }

      if (hasSelectionChanges) {
        setSelectedEdgeIds((prev) => {
          const next = new Set(prev);
          for (const { id, selected } of selectionChanges) {
            if (selected) {
              next.add(id);
            } else {
              next.delete(id);
            }
          }
          return next;
        });
      }
    },
    [onRemoveEdge],
  );

  const handleConnect: OnConnect = useCallback(
    (connection) => {
      if (connection.source && connection.target) {
        onAddEdge?.(connection.source, connection.target);
      }
    },
    [onAddEdge],
  );

  const handleSelectionChange = useCallback(
    ({ nodes }: { nodes: Node[] }) => {
      setSelectedNodeIds(new Set(nodes.map((n) => n.id)));
    },
    [],
  );

  return {
    selectedNodeIds,
    setSelectedNodeIds,
    selectedEdgeIds,
    handleNodesChange,
    handleEdgesChange,
    handleConnect,
    handleSelectionChange,
  };
}
