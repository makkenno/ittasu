import { useMachine } from "@xstate/react";
import {
  AlignJustify,
  ArrowUpDown,
  LayoutTemplate,
  Maximize2,
  MoreHorizontal,
  MousePointer2,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
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
import {
  type ExportedData,
  exportSelectedNodes,
} from "../../lib/export-import-utils";
import {
  findNextSelectionAfterDelete,
  type GraphLayoutDirection,
  getLayoutedElements,
} from "../../lib/graph-utils";
import { useIsCompactGraph, useIsMobile } from "../../lib/use-is-mobile";
import { cn } from "../../lib/utils";
import { useTaskStore } from "../../stores/task-store";
import { useToastStore } from "../../stores/toast-store";
import type { TaskEdge } from "../../types/edge";
import type { TaskNode as TaskNodeType } from "../../types/task";
import type { TaskTemplate, TemplateTask } from "../../types/template";
import { DeletableEdge } from "../molecules/graph/deletable-edge";
import { ImportDialog } from "../molecules/graph/import-dialog";
import { SaveTemplateDialog } from "../molecules/graph/save-template-dialog";
import { SelectionOverlay } from "../molecules/graph/selection-overlay";
import {
  TaskBottomSheet,
  type TaskBottomSheetHandle,
} from "../molecules/graph/task-bottom-sheet";
import {
  TaskDetailPanel,
  type TaskDetailPanelHandle,
} from "../molecules/graph/task-detail-panel";
import { TaskNode, type TaskNodeData } from "../molecules/graph/task-node";
import { TaskReorderDialog } from "../molecules/graph/task-reorder-dialog";
import { TaskSearchDialog } from "../molecules/graph/task-search-dialog";
import { TemplateDialog } from "../molecules/graph/template-dialog";
import { useGraphHandlers } from "./graph/hooks/use-graph-handlers";
import {
  animateViewport,
  FocusTaskViewport,
  useGraphLayoutLifecycle,
} from "./graph/hooks/use-graph-viewport";
import { useKeyboardShortcuts } from "./graph/hooks/use-keyboard-shortcuts";
import { useTaskInsertion } from "./graph/hooks/use-task-insertion";
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
  onAddTask?: (
    position?: { x: number; y: number },
    connectFromIds?: string[],
    connectToIds?: string[],
    removeEdgeIds?: string[],
  ) => string;
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
  onConnectIsolated?: () => void;
  onReorderTasks?: (taskIds: string[]) => void;
  parentId?: string | null;
  keyboardEnabled?: boolean;
  onSelectTask?: (taskId: string | null) => void;
  onEscapeToParent?: () => void;
  onFocusMemo?: () => void;
  onToggleMemo?: () => void;
  onEditCurrentTitle?: () => void;
  onCopyCurrent?: () => void;
  onOpenPreview?: () => void;
  focusTaskId?: string | null;
  onFocusTaskHandled?: (taskId: string) => void;
}

const getGraphLayoutDirection = (
  isCompactGraph: boolean,
): GraphLayoutDirection => (isCompactGraph ? "TB" : "LR");

const getGraphScopeKey = (
  parentId: string | null,
  layoutDirection: GraphLayoutDirection,
) => `${parentId ?? "root"}:${layoutDirection}`;

interface MobileGraphToolbarProps {
  moreOpen: boolean;
  onToggleSelection: () => void;
  onFitView: () => void;
  onFormat: () => void;
  onToggleMore: () => void;
  onImport: () => void;
  onTemplate: () => void;
  onReorder: () => void;
  onAddTask: () => void;
}

function MobileGraphToolbar({
  moreOpen,
  onToggleSelection,
  onFitView,
  onFormat,
  onToggleMore,
  onImport,
  onTemplate,
  onReorder,
  onAddTask,
}: MobileGraphToolbarProps) {
  return (
    <div
      className="absolute left-3 right-3 z-[60]"
      style={{
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)",
      }}
    >
      {moreOpen && (
        <div className="absolute bottom-[calc(100%+0.5rem)] right-0 w-44 rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl">
          <button
            type="button"
            onClick={onImport}
            className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-gray-700 transition-colors active:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Upload className="h-5 w-5" />
            インポート
          </button>
          <button
            type="button"
            onClick={onTemplate}
            className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-gray-700 transition-colors active:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <LayoutTemplate className="h-5 w-5" />
            テンプレート
          </button>
          <button
            type="button"
            onClick={onReorder}
            className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-gray-700 transition-colors active:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <ArrowUpDown className="h-5 w-5" />
            並び替え
          </button>
        </div>
      )}
      <div
        className="grid grid-cols-5 gap-1 rounded-2xl border border-gray-200 bg-white p-1.5 shadow-xl"
        role="toolbar"
        aria-label="グラフ操作"
      >
        <MobileToolbarButton
          icon={<MousePointer2 className="h-5 w-5" />}
          label="選択"
          onClick={onToggleSelection}
        />
        <MobileToolbarButton
          icon={<Maximize2 className="h-5 w-5" />}
          label="全体"
          onClick={onFitView}
        />
        <MobileToolbarButton
          icon={<AlignJustify className="h-5 w-5" />}
          label="整列"
          onClick={onFormat}
        />
        <MobileToolbarButton
          icon={<MoreHorizontal className="h-5 w-5" />}
          label="その他"
          onClick={onToggleMore}
          expanded={moreOpen}
        />
        <MobileToolbarButton
          icon={<Plus className="h-5 w-5" />}
          label="追加"
          onClick={onAddTask}
          primary
        />
      </div>
    </div>
  );
}

interface MobileToolbarButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
  primary?: boolean;
  expanded?: boolean;
}

function MobileToolbarButton({
  icon,
  label,
  onClick,
  disabled = false,
  destructive = false,
  primary = false,
  expanded,
}: MobileToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-expanded={expanded}
      className={cn(
        "flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        primary
          ? "bg-blue-600 text-white active:bg-blue-700 focus-visible:ring-offset-1"
          : destructive
            ? "text-red-600 active:bg-red-50 disabled:text-gray-300"
            : "text-gray-700 active:bg-gray-100 disabled:text-gray-300",
      )}
    >
      {icon}
      <span
        className={cn("text-[11px] font-medium", primary && "font-semibold")}
      >
        {label}
      </span>
    </button>
  );
}

interface MobileSelectionToolbarProps {
  selectedCount: number;
  onExit: () => void;
  onExport: () => void;
  onSaveTemplate: () => void;
  onDelete: () => void;
}

function MobileSelectionToolbar({
  selectedCount,
  onExit,
  onExport,
  onSaveTemplate,
  onDelete,
}: MobileSelectionToolbarProps) {
  const hasSelection = selectedCount > 0;

  return (
    <>
      <div className="pointer-events-none absolute left-1/2 top-3 z-[60] -translate-x-1/2">
        <output className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700 shadow-sm">
          選択モード・{selectedCount}件
        </output>
      </div>
      <div
        className="absolute left-3 right-3 z-[60] grid grid-cols-4 gap-1 rounded-2xl border border-gray-200 bg-white p-1.5 shadow-xl"
        style={{
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)",
        }}
        role="toolbar"
        aria-label="選択したタスクの操作"
      >
        <MobileToolbarButton
          icon={<MousePointer2 className="h-5 w-5" />}
          label="終了"
          onClick={onExit}
        />
        <MobileToolbarButton
          icon={<Upload className="h-5 w-5 rotate-180" />}
          label="コピー"
          onClick={onExport}
          disabled={!hasSelection}
        />
        <MobileToolbarButton
          icon={<LayoutTemplate className="h-5 w-5" />}
          label="保存"
          onClick={onSaveTemplate}
          disabled={!hasSelection}
        />
        <MobileToolbarButton
          icon={<Trash2 className="h-5 w-5" />}
          label="削除"
          onClick={onDelete}
          disabled={!hasSelection}
          destructive
        />
      </div>
    </>
  );
}

function EmptyGraphState({ onAddTask }: { onAddTask: () => void }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-6">
      <div className="pointer-events-auto max-w-xs rounded-xl border border-gray-200 bg-white/95 p-5 text-center shadow-sm backdrop-blur">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <Plus className="h-5 w-5" />
        </div>
        <p className="font-semibold text-gray-900">最初のタスクを追加</p>
        <p className="mt-1 text-sm leading-6 text-gray-500">
          タスクを追加すると、関係を線でつないで整理できます。
        </p>
        <button
          type="button"
          onClick={onAddTask}
          className="mt-4 min-h-11 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          タスクを追加
        </button>
      </div>
    </div>
  );
}

function TaskReorderDialogHost({
  open,
  nodes,
  edges,
  parentId,
  onClose,
  onSave,
}: {
  open: boolean;
  nodes: TaskNodeType[];
  edges: TaskEdge[];
  parentId: string | null;
  onClose: () => void;
  onSave: (taskIds: string[]) => void;
}) {
  if (!open) return null;
  return (
    <TaskReorderDialog
      nodes={nodes}
      edges={edges}
      parentId={parentId}
      onClose={onClose}
      onSave={onSave}
    />
  );
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
  onConnectIsolated,
  onReorderTasks,
  parentId = null,
  keyboardEnabled = true,
  onSelectTask,
  onEscapeToParent,
  onFocusMemo,
  onToggleMemo,
  onEditCurrentTitle,
  onCopyCurrent,
  onOpenPreview,
  focusTaskId,
  onFocusTaskHandled,
}: GraphAreaProps) {
  const isMobile = useIsMobile();
  const isCompactGraph = useIsCompactGraph();
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const [edgeSourceId, setEdgeSourceId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false);
  const [reorderOpen, setReorderOpen] = useState(false);
  const layoutDirection = getGraphLayoutDirection(isCompactGraph);
  const nodeTypes: NodeTypes = useMemo(() => ({ taskNode: TaskNode }), []);
  const edgeTypes = useMemo(() => ({ deletableEdge: DeletableEdge }), []);
  const lastClickTimeRef = useRef<number>(0);
  const DOUBLE_CLICK_DELAY = 300; // ミリ秒
  const containerRef = useRef<HTMLDivElement>(null);
  const taskBottomSheetRef = useRef<TaskBottomSheetHandle>(null);
  const taskDetailPanelRef = useRef<TaskDetailPanelHandle>(null);

  const formatNodes = useCallback(
    (nodesForLayout: TaskNodeType[], edgesForLayout: TaskEdge[]) => {
      if (!rfInstance) return;

      const nodeDimensions = new Map<
        string,
        { width: number; height: number }
      >();
      const rfNodes = rfInstance.getNodes();
      for (const node of rfNodes) {
        if (node.width && node.height) {
          nodeDimensions.set(node.id, {
            width: node.width,
            height: node.height,
          });
        }
      }

      const layoutedNodes = getLayoutedElements(
        nodesForLayout,
        edgesForLayout,
        nodeDimensions,
        layoutDirection,
      );

      const temporalApi = useTaskStore.temporal.getState();
      temporalApi.pause();
      try {
        onTaskNodesChange?.(layoutedNodes);
      } finally {
        temporalApi.resume();
      }
    },
    [layoutDirection, onTaskNodesChange, rfInstance],
  );

  const formatGraph = useCallback(() => {
    formatNodes(taskNodes, taskEdges);
  }, [formatNodes, taskNodes, taskEdges]);
  const formatAndFitGraph = useCallback(() => {
    formatGraph();
    window.setTimeout(() => rfInstance?.fitView({ duration: 400 }), 50);
  }, [formatGraph, rfInstance]);

  const skipNextTaskCountLayoutRef = useRef(false);
  const formatOnFocusTaskIdsRef = useRef<Set<string>>(new Set());
  const prepareTaskFocus = useCallback(
    (taskId: string) => {
      if (!formatOnFocusTaskIdsRef.current.delete(taskId)) return;
      formatGraph();
    },
    [formatGraph],
  );

  const trackAddedTask = useCallback(
    (taskId: string, formatBeforeFocus: boolean) => {
      if (formatBeforeFocus) formatOnFocusTaskIdsRef.current.add(taskId);
      skipNextTaskCountLayoutRef.current = true;
    },
    [],
  );

  const {
    addTaskAtViewCenter: handleAddTaskAtViewCenter,
    addUnconnectedTask,
    insertAtStart: handleInsertAtStart,
    insertAtEnd: handleInsertAtEnd,
    insertBeforeSelected: handleInsertBeforeSelected,
    insertAfterSelected: handleInsertAfterSelected,
    addSibling: handleAddSibling,
  } = useTaskInsertion({
    rfInstance,
    containerRef,
    taskNodes,
    taskEdges,
    selectedTask,
    parentId,
    layoutDirection,
    onAddTask,
    trackAddedTask,
  });

  const [state, send] = useMachine(
    graphMachine.provide({
      actions: {
        notifyNodeClick: ({ event }) => {
          if (event.type === "NODE_CLICK") {
            setSelectedEdgeId(null);
            onNodeClick?.(event.nodeId);
          }
        },
        notifyPaneClick: () => {
          setSelectedEdgeId(null);
          onPaneClickProp?.();
        },
        notifyNodeDoubleClick: ({ event }) => {
          if (event.type === "NODE_DOUBLE_CLICK") {
            onNodeDoubleClick?.(event.nodeId);
          }
        },
        notifyAddTask: handleInsertAtEnd,
        performDelete: ({ context }) => {
          const { nodesToDelete } = context;
          if (!nodesToDelete || nodesToDelete.size === 0) return;
          skipNextTaskCountLayoutRef.current = true;

          const yankData = exportSelectedNodes(
            taskNodes,
            taskEdges,
            nodesToDelete,
          );
          navigator.clipboard
            .writeText(JSON.stringify(yankData, null, 2))
            .catch(() => {});

          const nextSelectionId = findNextSelectionAfterDelete(
            nodesToDelete,
            taskNodes,
            taskEdges,
            parentId,
          );
          for (const id of nodesToDelete) {
            onRemoveTask?.(id);
          }
          onSelectTask?.(nextSelectionId);
          const count = nodesToDelete.size;
          addToast(
            count > 1
              ? `${count} 件のタスクを削除しました`
              : "タスクを削除しました",
            "success",
            {
              label: "元に戻す",
              onClick: () => useTaskStore.temporal.getState().undo(),
            },
          );
        },
      },
    }),
  );
  const isSelectionMode = state.matches("selecting");
  const selectedNodeIds = state.context.selectedNodeIds;
  const addToast = useToastStore((s) => s.addToast);

  const handleConnectFromSelected = useCallback(() => {
    if (!selectedTask) return;
    if (edgeSourceId === null) {
      setEdgeSourceId(selectedTask.id);
      addToast(
        "接続元を選択しました。接続先タスクへ移動して e で確定",
        "success",
      );
      return;
    }
    if (edgeSourceId === selectedTask.id) {
      setEdgeSourceId(null);
      return;
    }
    onAddEdge?.(edgeSourceId, selectedTask.id);
    addToast("タスクを接続しました", "success");
    setEdgeSourceId(null);
  }, [selectedTask, edgeSourceId, onAddEdge, addToast]);

  const handleCopyNode = useCallback(() => {
    if (isSelectionMode && selectedNodeIds.size > 0) {
      onExportSelected?.(selectedNodeIds);
      return;
    }
    if (selectedTask) {
      onExportTask?.(selectedTask.id);
      return;
    }
    onCopyCurrent?.();
  }, [
    isSelectionMode,
    selectedNodeIds,
    selectedTask,
    onExportSelected,
    onExportTask,
    onCopyCurrent,
  ]);

  const handlePasteImport = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      const parsed = JSON.parse(text) as ExportedData;
      if (
        parsed &&
        typeof parsed === "object" &&
        Array.isArray(parsed.nodes) &&
        Array.isArray(parsed.edges)
      ) {
        onImportTasks?.(parsed);
        addToast("クリップボードからインポートしました", "success");
      } else {
        addToast("クリップボードの内容が不正な形式です", "error");
      }
    } catch {
      addToast(
        "クリップボードから読み込めませんでした。インポートダイアログを開きます",
        "error",
      );
      send({ type: "OPEN_IMPORT" });
    }
  }, [onImportTasks, addToast, send]);

  const scopeKey = getGraphScopeKey(parentId, layoutDirection);
  useGraphLayoutLifecycle({
    rfInstance,
    scopeKey,
    taskCount: taskNodes.length,
    skipNextTaskCountLayoutRef,
    formatGraph,
    formatAndFitGraph,
  });

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
          isEdgeSource: edgeSourceId === task.id,
          layoutDirection,
        },
      })),
    [
      taskNodes,
      onToggleComplete,
      selectedNodeIds,
      isSelectionMode,
      selectedTask,
      edgeSourceId,
      layoutDirection,
    ],
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
        selected: selectedEdgeIds.has(edge.id) || selectedEdgeId === edge.id,
      })),
    [taskEdges, onRemoveEdge, selectedEdgeIds, selectedEdgeId],
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

  const handleSelectTaskFromKey = useCallback(
    (taskId: string | null) => {
      if (taskId && rfInstance) {
        const node = rfInstance.getNode(taskId);
        if (node && containerRef.current) {
          const zoom = rfInstance.getZoom();
          const width = node.width ?? 0;
          const height = node.height ?? 0;
          const target = {
            x:
              containerRef.current.clientWidth / 2 -
              (node.position.x + width / 2) * zoom,
            y:
              containerRef.current.clientHeight / 2 -
              (node.position.y + height / 2) * zoom,
            zoom,
          };
          const reduceMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
          ).matches;
          const start = rfInstance.getViewport();
          animateViewport({
            start,
            target,
            duration: reduceMotion ? 0 : 300,
            onUpdate: (viewport) => {
              void rfInstance.setViewport(viewport);
            },
            onFinish: () => {},
          });
        }
      }
      if (focusTaskId) onFocusTaskHandled?.(focusTaskId);
      onSelectTask?.(taskId);
    },
    [focusTaskId, onFocusTaskHandled, onSelectTask, rfInstance],
  );

  const handleUserMoveStart = useCallback(
    (event: MouseEvent | TouchEvent | null) => {
      if (!event || !focusTaskId) return;
      onFocusTaskHandled?.(focusTaskId);
    },
    [focusTaskId, onFocusTaskHandled],
  );

  const handleEditTitleFromKey = useCallback(
    (taskId: string) => {
      const focusTitle = () => {
        taskBottomSheetRef.current?.focusTitle();
        taskDetailPanelRef.current?.focusTitle();
      };

      if (selectedTask?.id === taskId) {
        focusTitle();
        return;
      }

      onSelectTask?.(taskId);
      requestAnimationFrame(() => requestAnimationFrame(focusTitle));
    },
    [onSelectTask, selectedTask?.id],
  );

  useKeyboardShortcuts({
    enabled: keyboardEnabled,
    selectedNodeIds,
    selectedTaskId: selectedTask?.id ?? null,
    selectedEdgeId,
    nodes: taskNodes,
    edges: taskEdges,
    onDelete: () => {
      if (selectedNodeIds.size > 0) {
        send({ type: "REQUEST_DELETE", nodeIds: Array.from(selectedNodeIds) });
      }
    },
    onAddTask: () => send({ type: "ADD_TASK" }),
    onInsertBefore: handleInsertBeforeSelected,
    onInsertAfter: handleInsertAfterSelected,
    onInsertAtStart: handleInsertAtStart,
    onInsertAtEnd: handleInsertAtEnd,
    onAddSiblingOfEnd: handleAddSibling,
    onEscape: () => {
      if (edgeSourceId !== null) {
        setEdgeSourceId(null);
        return;
      }
      if (selectedEdgeId !== null) {
        setSelectedEdgeId(null);
        return;
      }
      if (isSelectionMode) {
        send({ type: "TOGGLE_MODE" });
      } else if (selectedTask) {
        onSelectTask?.(null);
      } else {
        onEscapeToParent?.();
      }
    },
    onToggleSelectionMode: () => {
      const wasInSelection = isSelectionMode;
      send({ type: "TOGGLE_MODE" });
      if (!wasInSelection && selectedTask) {
        send({ type: "SET_SELECTION", nodeIds: [selectedTask.id] });
      }
    },
    onFormat: formatAndFitGraph,
    onConnectIsolated,
    onSelectTask: handleSelectTaskFromKey,
    onSelectEdge: setSelectedEdgeId,
    onOpenDetail: onNodeDoubleClick,
    onEditTitle: handleEditTitleFromKey,
    onToggleComplete,
    onDeleteEdge: (edgeId) => {
      onRemoveEdge?.(edgeId);
      setSelectedEdgeId(null);
    },
    onDeleteTask: (taskId) =>
      send({ type: "REQUEST_DELETE", nodeIds: [taskId] }),
    onCopyNode: handleCopyNode,
    onPaste: handlePasteImport,
    onFocusMemo,
    onToggleMemo,
    onEditCurrentTitle,
    selectionMode: isSelectionMode,
    onExtendSelection: (id) => send({ type: "SET_SELECTION", nodeIds: [id] }),
    onConnectFromSelected: handleConnectFromSelected,
    onZoomIn: () => rfInstance?.zoomIn({ duration: 200 }),
    onZoomOut: () => rfInstance?.zoomOut({ duration: 200 }),
    onFitView: () => rfInstance?.fitView({ duration: 400 }),
    onOpenSearch: () => setSearchOpen(true),
    onOpenPreview,
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

      if (isCompactGraph) {
        send({ type: "PANE_CLICK" });
        setMobileActionsOpen(false);
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

        addUnconnectedTask(position);
        lastClickTimeRef.current = 0;
      } else {
        lastClickTimeRef.current = currentTime;
        // シングルクリック時にパネルを閉じるなどの処理
        send({ type: "PANE_CLICK" });
      }
    },
    [rfInstance, isCompactGraph, isSelectionMode, send, addUnconnectedTask],
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
    <div
      ref={containerRef}
      className="relative h-full w-full overscroll-contain bg-gray-50 touch-manipulation"
    >
      <ReactFlow
        nodes={reactFlowNodes}
        edges={reactFlowEdges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        onPaneClick={onPaneClick}
        onMoveStart={handleUserMoveStart}
        onSelectionChange={handleSelectionChange}
        onInit={setRfInstance}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        deleteKeyCode={null}
        selectionOnDrag={!isSelectionMode}
        panOnDrag={!isSelectionMode}
        selectionKeyCode="Shift"
        multiSelectionKeyCode="Shift"
        selectionMode={SelectionMode.Partial}
        zoomOnDoubleClick={false}
      >
        <Background />
        <Controls className="hidden lg:flex" />
        <FocusTaskViewport
          taskId={focusTaskId}
          onHandled={onFocusTaskHandled}
          onPrepare={prepareTaskFocus}
          containerRef={containerRef}
        />
        {selectedTask && !isSelectionMode && !isMobile && (
          <TaskDetailPanel
            ref={taskDetailPanelRef}
            selectedTask={selectedTask}
            onTitleChange={onTitleChange}
            onDetailClick={onNodeDoubleClick}
            onDeleteClick={(taskId) =>
              send({ type: "REQUEST_DELETE", nodeIds: [taskId] })
            }
            onExportClick={onExportTask}
          />
        )}
      </ReactFlow>

      {taskNodes.length === 0 && !isSelectionMode && (
        <EmptyGraphState onAddTask={handleAddTaskAtViewCenter} />
      )}

      {selectedTask && !isSelectionMode && isMobile && (
        <TaskBottomSheet
          ref={taskBottomSheetRef}
          selectedTask={selectedTask}
          onTitleChange={onTitleChange}
          onDetailClick={onNodeDoubleClick}
          onToggleComplete={onToggleComplete}
          onDeleteClick={(taskId) =>
            send({ type: "REQUEST_DELETE", nodeIds: [taskId] })
          }
          onExportClick={onExportTask}
          onClose={() => onSelectTask?.(null)}
        />
      )}

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

      {searchOpen && (
        <TaskSearchDialog
          nodes={taskNodes}
          onClose={() => setSearchOpen(false)}
          onSelect={(taskId) => handleSelectTaskFromKey(taskId)}
        />
      )}

      <div className="absolute left-4 top-4 z-50 hidden flex-col gap-2 lg:flex">
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

        <button
          type="button"
          onClick={formatAndFitGraph}
          className={`flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 transition-colors ${
            isSelectionMode ? "hidden" : ""
          }`}
          title="自動整列"
        >
          <AlignJustify className="w-4 h-4" />
          <span className="text-sm font-medium hidden sm:inline">整列</span>
        </button>
      </div>

      {isSelectionMode && selectedNodeIds.size > 0 && (
        <div className="absolute bottom-12 right-4 z-50 hidden flex-col items-end gap-2 lg:flex">
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
            onClick={handleInsertAtEnd}
            className="absolute bottom-12 right-4 hidden items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white shadow-lg transition-colors hover:bg-blue-600 lg:flex"
            title="末尾にタスクを追加"
          >
            <Plus className="w-6 h-6 sm:w-5 sm:h-5" />
            <span className="font-medium hidden sm:inline">タスクを追加</span>
          </button>

          <button
            type="button"
            onClick={() => send({ type: "OPEN_TEMPLATE" })}
            className="absolute bottom-24 right-4 hidden items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 shadow-lg transition-colors hover:bg-gray-50 lg:flex"
            title="テンプレート"
          >
            <LayoutTemplate className="w-6 h-6 sm:w-5 sm:h-5" />
            <span className="font-medium hidden sm:inline">テンプレート</span>
          </button>
        </>
      )}

      {isCompactGraph && isSelectionMode && (
        <MobileSelectionToolbar
          selectedCount={selectedNodeIds.size}
          onExit={() => send({ type: "TOGGLE_MODE" })}
          onExport={handleExportSelected}
          onSaveTemplate={() => send({ type: "OPEN_SAVE_TEMPLATE" })}
          onDelete={handleDeleteSelected}
        />
      )}

      {isCompactGraph && !isSelectionMode && !selectedTask && (
        <MobileGraphToolbar
          moreOpen={mobileActionsOpen}
          onToggleSelection={() => send({ type: "TOGGLE_MODE" })}
          onFitView={() => rfInstance?.fitView({ duration: 400 })}
          onFormat={formatAndFitGraph}
          onToggleMore={() => setMobileActionsOpen((open) => !open)}
          onImport={() => {
            setMobileActionsOpen(false);
            send({ type: "OPEN_IMPORT" });
          }}
          onTemplate={() => {
            setMobileActionsOpen(false);
            send({ type: "OPEN_TEMPLATE" });
          }}
          onReorder={() => {
            setMobileActionsOpen(false);
            setReorderOpen(true);
          }}
          onAddTask={handleInsertAtEnd}
        />
      )}

      <TaskReorderDialogHost
        open={reorderOpen}
        nodes={taskNodes}
        edges={taskEdges}
        parentId={parentId}
        onClose={() => setReorderOpen(false)}
        onSave={(taskIds) => {
          onReorderTasks?.(taskIds);
          setReorderOpen(false);
          addToast("並び順を更新しました", "success", {
            label: "元に戻す",
            onClick: () => useTaskStore.temporal.getState().undo(),
          });
        }}
      />
    </div>
  );
}
