import { LayoutTemplate, Plus, Upload } from "lucide-react";
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
import { TemplateDialog } from "../molecules/graph/template-dialog";
import type { TaskTemplate } from "../../types/template";
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
  onAddTemplate?: (
    template: {
      tasks: {
        title: string;
        memo?: string;
        position: { x: number; y: number };
      }[];
      edges: { sourceIndex: number; targetIndex: number }[];
    },
  ) => void;
  onAddEdge?: (source: string, target: string) => void;
  onRemoveEdge?: (edgeId: string) => void;
  onRemoveTask?: (taskId: string) => void;
  onPaneClick?: () => void;
  onImportTasks?: (data: ExportedData) => void;
  onExportTask?: (taskId: string) => void;
  parentId: string | null;
  shouldAutoFocus?: boolean;
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
  onAddTemplate,
  onAddEdge,
  onRemoveEdge,
  onRemoveTask,
  onPaneClick: onPaneClickProp,
  onImportTasks,
  onExportTask,
  parentId,
  shouldAutoFocus = false,
}: GraphAreaProps) {
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const nodeTypes: NodeTypes = useMemo(() => ({ taskNode: TaskNode }), []);
  const edgeTypes = useMemo(() => ({ deletableEdge: DeletableEdge }), []);
  const lastClickTimeRef = useRef<number>(0);
  const DOUBLE_CLICK_DELAY = 300; // ミリ秒
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);

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

  useKeyboardShortcuts({
    selectedNodeIds,
    onRemoveTask,
    setSelectedNodeIds,
    onAddTask: handleAddTaskAtViewCenter,
  });

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

  const handleTemplateSelect = useCallback(
    (template: TaskTemplate) => {
      if (!rfInstance || !containerRef.current) return;

      const { top, left, width, height } =
        containerRef.current.getBoundingClientRect();

      // 画面中央のフロー座標を取得
      const centerPosition = rfInstance.screenToFlowPosition({
        x: left + width / 2,
        y: top + height / 2,
      });

      const tasksToAdd = template.tasks.map((task) => ({
        title: task.title,
        memo: task.memo,
        position: {
          x: centerPosition.x + task.relativePosition.x - 250, // 中央寄せのための調整 (概算)
          y: centerPosition.y + task.relativePosition.y,
        },
      }));

      onAddTemplate?.({
        tasks: tasksToAdd,
        edges: template.edges,
      });
      setIsTemplateDialogOpen(false);
    },
    [rfInstance, onAddTemplate],
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
            autoFocus={shouldAutoFocus}
          />
        )}
      </ReactFlow>

      <ImportDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onImport={(data) => onImportTasks?.(data)}
      />

      <TemplateDialog
        isOpen={isTemplateDialogOpen}
        onClose={() => setIsTemplateDialogOpen(false)}
        onSelect={handleTemplateSelect}
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
        className="absolute bottom-12 right-4 flex items-center gap-2 p-3 sm:px-4 sm:py-2 bg-blue-500 text-white rounded-full sm:rounded-lg shadow-lg hover:bg-blue-600 transition-colors pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pb-[calc(0.5rem+env(safe-area-inset-bottom))]"
        title="新しいタスクを追加"
      >
        <Plus className="w-6 h-6 sm:w-5 sm:h-5" />
        <span className="font-medium hidden sm:inline">タスクを追加</span>
      </button>

      <button
        type="button"
        onClick={() => setIsTemplateDialogOpen(true)}
        className="absolute bottom-28 sm:bottom-24 right-4 flex items-center gap-2 p-3 sm:px-4 sm:py-2 bg-white border border-gray-300 text-gray-700 rounded-full sm:rounded-lg shadow-lg hover:bg-gray-50 transition-colors pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pb-[calc(0.5rem+env(safe-area-inset-bottom))]"
        title="テンプレート"
      >
        <LayoutTemplate className="w-6 h-6 sm:w-5 sm:h-5" />
        <span className="font-medium hidden sm:inline">テンプレート</span>
      </button>
    </div>
  );
}
