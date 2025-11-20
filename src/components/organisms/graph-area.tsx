import { Plus, Trash2 } from "lucide-react";
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
  SelectionMode,
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
  const lastClickTimeRef = useRef<number>(0);
  const DOUBLE_CLICK_DELAY = 300; // ミリ秒

  // 選択されたノードのID
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(
    new Set(),
  );

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

  const handleSelectionChange = useCallback(({ nodes }: { nodes: Node[] }) => {
    setSelectedNodeIds(new Set(nodes.map((n) => n.id)));
  }, []);

  const handleAddTaskAtViewCenter = useCallback(() => {
    if (rfInstance) {
      // 現在のビューポートの中心を取得
      const viewport = rfInstance.getViewport();
      const { x: viewX, y: viewY, zoom } = viewport;

      const centerX = -viewX / zoom + 500 / zoom;
      const centerY = -viewY / zoom + 250 / zoom;

      onAddTask?.({ x: centerX, y: centerY });
    } else {
      onAddTask?.();
    }
  }, [rfInstance, onAddTask]);

  const onPaneClick = useCallback(
    (event: React.MouseEvent) => {
      if (!rfInstance) return;

      // 範囲選択中はタスク作成をスキップ
      if (event.shiftKey) return;

      const currentTime = Date.now();
      const timeSinceLastClick = currentTime - lastClickTimeRef.current;

      if (timeSinceLastClick < DOUBLE_CLICK_DELAY) {
        // ダブルクリック検出
        const position = rfInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        onAddTask?.(position);
        lastClickTimeRef.current = 0;
      } else {
        lastClickTimeRef.current = currentTime;
      }
    },
    [rfInstance, onAddTask],
  );

  useEffect(() => {
    if (selectedTask?.id && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [selectedTask?.id]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        (event.key === "Delete" || event.key === "Backspace") &&
        selectedNodeIds.size > 0
      ) {
        const activeElement = document.activeElement;
        if (
          activeElement?.tagName === "INPUT" ||
          activeElement?.tagName === "TEXTAREA"
        ) {
          return;
        }

        for (const nodeId of selectedNodeIds) {
          onRemoveTask?.(nodeId);
        }
        setSelectedNodeIds(new Set());
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedNodeIds, onRemoveTask]);

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
        onSelectionChange={handleSelectionChange}
        onInit={setRfInstance}
        nodeTypes={nodeTypes}
        selectionOnDrag
        panOnDrag={true}
        selectionKeyCode="Shift"
        multiSelectionKeyCode="Shift"
        selectionMode={SelectionMode.Partial}
        zoomOnDoubleClick={false}
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
              <button
                type="button"
                onClick={() => onRemoveTask?.(selectedTask.id)}
                className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors"
                title="このタスクを削除"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-sm font-medium">削除</span>
              </button>
            </div>
          </Panel>
        )}
      </ReactFlow>

      <button
        type="button"
        onClick={handleAddTaskAtViewCenter}
        className="absolute bottom-20 right-4 flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600 transition-colors"
        title="新しいタスクを追加"
      >
        <Plus className="w-5 h-5" />
        <span className="font-medium">タスクを追加</span>
      </button>
    </div>
  );
}
