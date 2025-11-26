import { Plus, Upload } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  type Edge,
  MarkerType,
  type Node,
  type NodeTypes,
  type ReactFlowInstance,
  SelectionMode,
} from "reactflow";
import "reactflow/dist/style.css";
import type { ExportedData } from "../../lib/export-import-utils";
import type { TaskEdge } from "../../types/edge";
import type { TaskNode as TaskNodeType } from "../../types/task";
import { DeletableEdge } from "../molecules/graph/deletable-edge";
import { ImportDialog } from "../molecules/graph/import-dialog";
import { TaskDetailPanel } from "../molecules/graph/task-detail-panel";
import { TaskNode, type TaskNodeData } from "../molecules/graph/task-node";
import { useGraphHandlers } from "./graph/hooks/use-graph-handlers";
import { useKeyboardShortcuts } from "./graph/hooks/use-keyboard-shortcuts";

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
  onPaneClick?: () => void;
  onImportTasks?: (data: ExportedData) => void;
  onExportTask?: (taskId: string) => void;
  parentId: string | null;
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
  onPaneClick: onPaneClickProp,
  onImportTasks,
  onExportTask,
  parentId,
}: GraphAreaProps) {
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const nodeTypes: NodeTypes = useMemo(() => ({ taskNode: TaskNode }), []);
  const edgeTypes = useMemo(() => ({ deletableEdge: DeletableEdge }), []);
  const lastClickTimeRef = useRef<number>(0);
  const DOUBLE_CLICK_DELAY = 300; // ミリ秒
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: parentId is used as a trigger
  useEffect(() => {
    if (rfInstance) {
      const timer = setTimeout(() => {
        rfInstance.fitView({ duration: 800 });
      }, 50);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [rfInstance, parentId]);

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

  const {
    selectedNodeIds,
    setSelectedNodeIds,
    selectedEdgeIds,
    handleNodesChange,
    handleEdgesChange,
    handleConnect,
    handleSelectionChange,
  } = useGraphHandlers({
    taskNodes,
    reactFlowNodes,
    onTaskNodesChange,
    onRemoveTask,
    onRemoveEdge,
    onAddEdge,
  });

  useKeyboardShortcuts({
    selectedNodeIds,
    onRemoveTask,
    setSelectedNodeIds,
  });

  const reactFlowEdges: Edge[] = useMemo(
    () =>
      taskEdges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: "deletableEdge",
        data: {
          onRemoveEdge,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
        },
        style: {
          strokeWidth: 2,
        },
        selected: selectedEdgeIds.has(edge.id),
      })),
    [taskEdges, onRemoveEdge, selectedEdgeIds],
  );

  const containerRef = useRef<HTMLDivElement>(null);

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

  const handleAddTaskAtViewCenter = useCallback(() => {
    if (rfInstance && containerRef.current) {
      const { top, left, width, height } =
        containerRef.current.getBoundingClientRect();

      const position = rfInstance.screenToFlowPosition({
        x: left + width / 2,
        y: top + height / 3,
      });

      onAddTask?.(position);
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
        // シングルクリック時にパネルを閉じるなどの処理
        onPaneClickProp?.();
      }
    },
    [rfInstance, onAddTask, onPaneClickProp],
  );

  return (
    <div ref={containerRef} className="w-full h-full bg-gray-50 relative">
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
        edgeTypes={edgeTypes}
        selectionOnDrag
        panOnDrag={true}
        selectionKeyCode="Shift"
        multiSelectionKeyCode="Shift"
        selectionMode={SelectionMode.Partial}
        zoomOnDoubleClick={false}
        fitView
      >
        <Background />
        <Controls className="mb-20 sm:mb-0" />
        {selectedTask && (
          <TaskDetailPanel
            selectedTask={selectedTask}
            onTitleChange={onTitleChange}
            onDetailClick={onNodeDoubleClick}
            onDeleteClick={onRemoveTask}
            onExportClick={onExportTask}
          />
        )}
      </ReactFlow>

      <ImportDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onImport={(data) => onImportTasks?.(data)}
      />

      <div className="absolute top-4 left-4 flex gap-2">
        <button
          type="button"
          onClick={() => setIsImportDialogOpen(true)}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
          title="タスクをインポート"
        >
          <Upload className="w-4 h-4" />
          <span className="text-sm font-medium hidden sm:inline">
            インポート
          </span>
        </button>
      </div>

      <button
        type="button"
        onClick={handleAddTaskAtViewCenter}
        className="absolute bottom-12 right-4 flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600 transition-colors pb-[calc(0.5rem+env(safe-area-inset-bottom))]"
        title="新しいタスクを追加"
      >
        <Plus className="w-5 h-5" />
        <span className="font-medium">タスクを追加</span>
      </button>
    </div>
  );
}
