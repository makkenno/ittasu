import { useMachine } from "@xstate/react";
import {
  LayoutTemplate,
  MousePointer2,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
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
import type { TaskTemplate, TemplateTask } from "../../types/template";
import { ConfirmDialog } from "../molecules/common/confirm-dialog";
import { DeletableEdge } from "../molecules/graph/deletable-edge";
import { ImportDialog } from "../molecules/graph/import-dialog";
import { SaveTemplateDialog } from "../molecules/graph/save-template-dialog";
import { SelectionOverlay } from "../molecules/graph/selection-overlay";
import { TaskDetailPanel } from "../molecules/graph/task-detail-panel";
import { TaskNode, type TaskNodeData } from "../molecules/graph/task-node";
import { TemplateDialog } from "../molecules/graph/template-dialog";
import { useGraphHandlers } from "./graph/hooks/use-graph-handlers";
import { useKeyboardShortcuts } from "./graph/hooks/use-keyboard-shortcuts";
import { graphMachine } from "./graph/machines/graph-machine";

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
  onAddTemplate?: (template: {
    tasks: (TemplateTask & { position: { x: number; y: number } })[];
    edges: { sourceIndex: number; targetIndex: number }[];
  }) => void;
  onAddEdge?: (source: string, target: string) => void;
  onRemoveEdge?: (edgeId: string) => void;
  onRemoveTask?: (taskId: string) => void;
  onPaneClick?: () => void;
  onImportTasks?: (data: ExportedData) => void;
  onExportTask?: (taskId: string) => void;
  onExportSelected?: (selectedIds: Set<string>) => void;
  onSaveTemplate?: (
    name: string,
    description: string,
    selectedNodeIds: Set<string>,
  ) => void;
  parentId?: string | null;
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
  onExportSelected,
  onSaveTemplate,
  parentId = null,
  shouldAutoFocus = false,
}: GraphAreaProps) {
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const nodeTypes: NodeTypes = useMemo(() => ({ taskNode: TaskNode }), []);
  const edgeTypes = useMemo(() => ({ deletableEdge: DeletableEdge }), []);
  const lastClickTimeRef = useRef<number>(0);
  const DOUBLE_CLICK_DELAY = 300; // ミリ秒
  const containerRef = useRef<HTMLDivElement>(null);

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

  const [state, send] = useMachine(
    graphMachine.provide({
      actions: {
        notifyNodeClick: ({ event }) => {
          if (event.type === "NODE_CLICK") {
            onNodeClick?.(event.nodeId);
          }
        },
        notifyPaneClick: () => {
          onPaneClickProp?.();
        },
        notifyNodeDoubleClick: ({ event }) => {
          if (event.type === "NODE_DOUBLE_CLICK") {
            onNodeDoubleClick?.(event.nodeId);
          }
        },
        notifyAddTask: handleAddTaskAtViewCenter,
        performDelete: () => {
          const { nodesToDelete } = state.context;
          if (nodesToDelete) {
            for (const id of nodesToDelete) {
              onRemoveTask?.(id);
            }
          }
        },
      },
    }),
  );
  const isSelectionMode = state.matches("selecting");
  const selectedNodeIds = state.context.selectedNodeIds;

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
        selected:
          selectedNodeIds.has(task.id) ||
          (!isSelectionMode && selectedTask?.id === task.id),
        data: {
          task,
          onToggleComplete,
        },
      })),
    [taskNodes, onToggleComplete, selectedNodeIds, isSelectionMode, selectedTask],
  );

  const {
    selectedEdgeIds,
    handleNodesChange,
    handleEdgesChange,
    handleConnect,
  } = useGraphHandlers({
    taskNodes,
    reactFlowNodes,
    onTaskNodesChange,
    onRemoveTask,
    onRemoveEdge,
    onAddEdge,
  });

  const handleSelectionChange = useCallback(
    ({ nodes }: { nodes: Node[] }) => {
      const ids = nodes.map((n) => n.id);
      send({ type: "SET_SELECTION", nodeIds: ids });
    },
    [send],
  );

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

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      send({ type: "NODE_CLICK", nodeId: node.id });
    },
    [send],
  );

  const handleNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      send({ type: "NODE_DOUBLE_CLICK", nodeId: node.id });
    },
    [send],
  );



  useKeyboardShortcuts({
    selectedNodeIds,
    onDelete: () => {
      if (selectedNodeIds.size > 0) {
        send({ type: "REQUEST_DELETE", nodeIds: Array.from(selectedNodeIds) });
      }
    },
    onAddTask: () => send({ type: "ADD_TASK" }),
    onEscape: () => {
      if (isSelectionMode) {
        send({ type: "TOGGLE_MODE" });
      }
    },
    onToggleSelectionMode: () => {
      send({ type: "TOGGLE_MODE" });
    },
  });

  const onPaneClick = useCallback(
    (event: React.MouseEvent) => {
      if (!rfInstance) return;

      // 範囲選択中はタスク作成をスキップ
      if (event.shiftKey || isSelectionMode) {
        if (isSelectionMode) {
          send({ type: "PANE_CLICK" });
        }
        return;
      }

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
        send({ type: "PANE_CLICK" });
      }
    },
    [rfInstance, onAddTask, isSelectionMode, send],
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
        relativePosition: task.relativePosition,
        children: task.children,
        edges: task.edges,
      }));

      onAddTemplate?.({
        tasks: tasksToAdd,
        edges: template.edges,
      });
      send({ type: "CLOSE_DIALOG" });
    },
    [rfInstance, onAddTemplate, send],
  );

  const handleOverlaySelectionChange = useCallback(
    (ids: string[]) => {
      send({ type: "SET_SELECTION", nodeIds: ids });
    },
    [send],
  );

  const handleDeleteSelected = useCallback(() => {
    if (selectedNodeIds.size === 0) return;
    send({ type: "REQUEST_DELETE", nodeIds: Array.from(selectedNodeIds) });
  }, [selectedNodeIds, send]);



  const handleExportSelected = useCallback(() => {
    if (selectedNodeIds.size === 0) return;
    onExportSelected?.(selectedNodeIds);
  }, [selectedNodeIds, onExportSelected]);

  const handleSaveTemplate = useCallback(
    (name: string, description: string) => {
      if (selectedNodeIds.size === 0) return;
      onSaveTemplate?.(name, description, selectedNodeIds);
      send({ type: "CLOSE_DIALOG" });
    },
    [selectedNodeIds, onSaveTemplate, send],
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
        selectionOnDrag={!isSelectionMode}
        panOnDrag={!isSelectionMode}
        selectionKeyCode="Shift"
        multiSelectionKeyCode="Shift"
        selectionMode={SelectionMode.Partial}
        zoomOnDoubleClick={false}
        fitView
      >
        <Background />
        <Controls className="mb-20 sm:mb-0" />
        {selectedTask && !isSelectionMode && (
          <TaskDetailPanel
            selectedTask={selectedTask}
            onTitleChange={onTitleChange}
            onDetailClick={onNodeDoubleClick}
            onDeleteClick={(taskId) =>
              send({ type: "REQUEST_DELETE", nodeIds: [taskId] })
            }
            onExportClick={onExportTask}
            autoFocus={shouldAutoFocus}
          />
        )}
      </ReactFlow>

      {isSelectionMode && rfInstance && (
        <SelectionOverlay
          rfInstance={rfInstance}
          onSelectionChange={handleOverlaySelectionChange}
          onNodeClick={(nodeId) => send({ type: "NODE_CLICK", nodeId })}
          onPaneClick={() => send({ type: "PANE_CLICK" })}
          nodes={reactFlowNodes.map((n) => {
            const internalNode = rfInstance.getNode(n.id);
            return {
              id: n.id,
              position: n.position,
              width: internalNode?.width || undefined,
              height: internalNode?.height || undefined,
            };
          })}
        />
      )}

      <ImportDialog
        isOpen={state.matches("importing")}
        onClose={() => send({ type: "CLOSE_DIALOG" })}
        onImport={(data) => {
          onImportTasks?.(data);
          send({ type: "CLOSE_DIALOG" });
        }}
      />

      <TemplateDialog
        isOpen={state.matches("templating")}
        onClose={() => send({ type: "CLOSE_DIALOG" })}
        onSelect={handleTemplateSelect}
      />

      <SaveTemplateDialog
        isOpen={state.matches("savingTemplate")}
        onClose={() => send({ type: "CLOSE_DIALOG" })}
        onSave={handleSaveTemplate}
      />

      <ConfirmDialog
        isOpen={state.matches("deleting")}
        title="タスクの削除"
        message={`選択した${state.context.nodesToDelete?.size ?? 0}件のタスクを削除してもよろしいですか？この操作は取り消せません。`}
        confirmLabel="削除"
        isDestructive
        onConfirm={() => send({ type: "CONFIRM_DELETE" })}
        onCancel={() => send({ type: "CANCEL_DELETE" })}
      />

      <div className="absolute top-4 left-4 flex flex-col gap-2 z-50">
        <button
          type="button"
          onClick={() => send({ type: "TOGGLE_MODE" })}
          className={`flex items-center gap-2 px-3 py-2 border rounded-lg shadow-sm transition-colors ${
            isSelectionMode
              ? "bg-gray-100 text-gray-900 border-gray-400 hover:bg-gray-200"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
          }`}
          title={isSelectionMode ? "選択モードを終了" : "選択モードを開始"}
        >
          <MousePointer2 className="w-4 h-4" />
          <span className="text-sm font-medium hidden sm:inline">
            {isSelectionMode ? "選択モード中" : "選択"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => send({ type: "OPEN_IMPORT" })}
          className={`flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 transition-colors ${
            isSelectionMode ? "hidden" : ""
          }`}
          title="タスクをインポート"
        >
          <Upload className="w-4 h-4" />
          <span className="text-sm font-medium hidden sm:inline">
            インポート
          </span>
        </button>
      </div>

      {isSelectionMode && selectedNodeIds.size > 0 && (
        <div className="absolute bottom-12 right-4 flex flex-col gap-2 z-50 items-end">
          <button
            type="button"
            onClick={handleExportSelected}
            className="flex items-center gap-2 p-3 sm:px-4 sm:py-2 bg-white text-gray-700 border border-gray-300 rounded-full sm:rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
            title="選択したタスクをエクスポート"
          >
            <Upload className="w-6 h-6 sm:w-5 sm:h-5 rotate-180" />
            <span className="font-medium hidden sm:inline">
              エクスポート ({selectedNodeIds.size})
            </span>
          </button>
          <button
            type="button"
            onClick={() => send({ type: "OPEN_SAVE_TEMPLATE" })}
            className="flex items-center gap-2 p-3 sm:px-4 sm:py-2 bg-white text-blue-600 border border-gray-300 rounded-full sm:rounded-lg shadow-lg hover:bg-blue-50 transition-colors"
            title="選択したタスクをテンプレートとして保存"
          >
            <LayoutTemplate className="w-6 h-6 sm:w-5 sm:h-5" />
            <span className="font-medium hidden sm:inline">
              テンプレート保存 ({selectedNodeIds.size})
            </span>
          </button>
          <button
            type="button"
            onClick={handleDeleteSelected}
            className="flex items-center gap-2 p-3 sm:px-4 sm:py-2 bg-white text-red-600 border border-gray-300 rounded-full sm:rounded-lg shadow-lg hover:bg-red-50 transition-colors"
            title="選択したタスクを削除"
          >
            <Trash2 className="w-6 h-6 sm:w-5 sm:h-5" />
            <span className="font-medium hidden sm:inline">
              削除 ({selectedNodeIds.size})
            </span>
          </button>
        </div>
      )}

      {!isSelectionMode && (
        <>
          <button
            type="button"
            onClick={handleAddTaskAtViewCenter}
            className="absolute bottom-12 right-4 flex items-center gap-2 p-3 sm:px-4 sm:py-2 bg-blue-500 text-white rounded-full sm:rounded-lg shadow-lg hover:bg-blue-600 transition-colors"
            title="新しいタスクを追加"
          >
            <Plus className="w-6 h-6 sm:w-5 sm:h-5" />
            <span className="font-medium hidden sm:inline">タスクを追加</span>
          </button>

          <button
            type="button"
            onClick={() => send({ type: "OPEN_TEMPLATE" })}
            className="absolute bottom-28 sm:bottom-24 right-4 flex items-center gap-2 p-3 sm:px-4 sm:py-2 bg-white border border-gray-300 text-gray-700 rounded-full sm:rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
            title="テンプレート"
          >
            <LayoutTemplate className="w-6 h-6 sm:w-5 sm:h-5" />
            <span className="font-medium hidden sm:inline">テンプレート</span>
          </button>
        </>
      )}
    </div>
  );
}
