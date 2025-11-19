import { Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  applyNodeChanges,
  Background,
  Controls,
  type Edge,
  MarkerType,
  type Node,
  type NodeTypes,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
  Panel,
  type ReactFlowInstance,
} from "reactflow";
import "reactflow/dist/style.css";
import type { TaskEdge } from "../../types/edge";
import type { TaskNode as TaskNodeType } from "../../types/task";
import { TaskNode, type TaskNodeData } from "../molecules/graph/task-node";

interface GraphAreaProps {
  nodes: TaskNodeType[];
  edges: TaskEdge[];
  selectedTask: TaskNodeType | null;
  onNodesChange?: (nodes: TaskNodeType[]) => void;
  onNodeClick?: (taskId: string) => void;
  onNodeDoubleClick?: (taskId: string) => void;
  onToggleComplete?: (taskId: string) => void;
  onTitleChange?: (taskId: string, newTitle: string) => void;
  onAddTask?: (position?: { x: number; y: number }) => void;
  onAddEdge?: (source: string, target: string) => void;
  onRemoveEdge?: (edgeId: string) => void;
  onRemoveTask?: (taskId: string) => void;
}

export function GraphArea({
  nodes: taskNodes,
  edges: taskEdges,
  selectedTask,
  onNodesChange: onTaskNodesChange,
  onNodeClick,
  onNodeDoubleClick,
  onToggleComplete,
  onTitleChange,
  onAddTask,
  onAddEdge,
  onRemoveEdge,
  onRemoveTask,
}: GraphAreaProps) {
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const nodeTypes: NodeTypes = useMemo(() => ({ taskNode: TaskNode }), []);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const reactFlowNodes: Node<TaskNodeData>[] = useMemo(
    () =>
      taskNodes.map((task) => ({
        id: task.id,
        type: "taskNode",
        position: task.position,
        data: {
          task,
          onToggleComplete,
        },
      })),
    [taskNodes, onToggleComplete],
  );

  const reactFlowEdges: Edge[] = useMemo(
    () =>
      taskEdges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: "bezier",
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
        },
        style: {
          strokeWidth: 2,
        },
      })),
    [taskEdges],
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
      for (const change of changes) {
        if (change.type === "remove") {
          onRemoveEdge?.(change.id);
        }
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

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onNodeClick?.(node.id);
    },
    [onNodeClick],
  );

  const handleNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onNodeDoubleClick?.(node.id);
    },
    [onNodeDoubleClick],
  );

  const onPaneClick = useCallback(
    (event: React.MouseEvent) => {
      if (!rfInstance) return;

      const position = rfInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      onAddTask?.(position);
    },
    [rfInstance, onAddTask],
  );

  useEffect(() => {
    if (selectedTask?.id && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [selectedTask?.id]);

  return (
    <div className="w-full h-full bg-gray-50 relative">
      <ReactFlow
        nodes={reactFlowNodes}
        edges={reactFlowEdges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        onPaneClick={onPaneClick}
        onInit={setRfInstance}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        {selectedTask && (
          <Panel
            position="top-right"
            className="bg-white p-4 rounded-lg shadow-xl border border-gray-200 w-80 m-4"
          >
            <div className="flex flex-col gap-4">
              <div>
                <label
                  htmlFor="title"
                  className="block text-xs font-bold text-gray-500 uppercase mb-1"
                >
                  タイトル
                </label>
                <input
                  id="title"
                  type="text"
                  ref={titleInputRef}
                  value={selectedTask.title}
                  onChange={(e) =>
                    onTitleChange?.(selectedTask.id, e.target.value)
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </Panel>
        )}
      </ReactFlow>

      <button
        type="button"
        onClick={() => onAddTask?.()}
        className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600 transition-colors"
        title="新しいタスクを追加"
      >
        <Plus className="w-5 h-5" />
        <span className="font-medium">タスクを追加</span>
      </button>
    </div>
  );
}
