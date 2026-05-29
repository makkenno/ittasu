import { useMachine } from "@xstate/react";
import {
  AlignJustify,
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
import {
  type ExportedData,
  exportSelectedNodes,
  exportSubgraph,
} from "../../lib/export-import-utils";
import {
  findEndNode,
  findFreePosition,
  findNextSelectionAfterDelete,
  findPredecessors,
  getLayoutedElements,
} from "../../lib/graph-utils";
import { useToastStore } from "../../stores/toast-store";
import type { TaskEdge } from "../../types/edge";
import type { TaskNode as TaskNodeType } from "../../types/task";
import type { TaskTemplate, TemplateTask } from "../../types/template";
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
  onAddTask?: (
    position?: { x: number; y: number },
    connectFromIds?: string[],
  ) => void;
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
  parentId?: string | null;
  titleFocusToken?: number;
  onRequestTitleFocus?: () => void;
  keyboardEnabled?: boolean;
  onSelectTask?: (taskId: string | null) => void;
  onEscapeToParent?: () => void;
  onFocusMemo?: () => void;
  onToggleMemo?: () => void;
  onEditCurrentTitle?: () => void;
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
  parentId = null,
  titleFocusToken = 0,
  onRequestTitleFocus,
  keyboardEnabled = true,
  onSelectTask,
  onEscapeToParent,
  onFocusMemo,
  onToggleMemo,
  onEditCurrentTitle,
}: GraphAreaProps) {
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const [edgeSourceId, setEdgeSourceId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const nodeTypes: NodeTypes = useMemo(() => ({ taskNode: TaskNode }), []);
  const edgeTypes = useMemo(() => ({ deletableEdge: DeletableEdge }), []);
  const lastClickTimeRef = useRef<number>(0);
  const DOUBLE_CLICK_DELAY = 300; // ミリ秒
  const containerRef = useRef<HTMLDivElement>(null);

  const panToPosition = useCallback(
    (position: { x: number; y: number }) => {
      if (!rfInstance) return;
      const zoom = rfInstance.getZoom();
      rfInstance.setCenter(position.x, position.y, {
        zoom,
        duration: 600,
      });
    },
    [rfInstance],
  );

  const handleAddTaskAtViewCenter = useCallback(() => {
    if (rfInstance && containerRef.current) {
      const { top, left, width, height } =
        containerRef.current.getBoundingClientRect();

      const centerPosition = rfInstance.screenToFlowPosition({
        x: left + width / 2,
        y: top + height / 2,
      });

      const existingNodes = rfInstance.getNodes();
      const newPosition = findFreePosition(centerPosition, existingNodes);

      onAddTask?.(newPosition);
      panToPosition(newPosition);
    } else {
      onAddTask?.();
    }
  }, [rfInstance, onAddTask, panToPosition]);

  const handleAddConnectedAfterSelected = useCallback(() => {
    if (!rfInstance) {
      onAddTask?.();
      return;
    }
    const existingNodes = rfInstance.getNodes();
    const selected = selectedTask
      ? existingNodes.find((n) => n.id === selectedTask.id)
      : null;
    if (!selected) {
      handleAddTaskAtViewCenter();
      return;
    }
    const base = {
      x: selected.position.x + (selected.width ?? 250) + 80,
      y: selected.position.y,
    };
    const newPosition = findFreePosition(base, existingNodes);
    onAddTask?.(newPosition, [selected.id]);
    panToPosition(newPosition);
  }, [
    rfInstance,
    selectedTask,
    onAddTask,
    panToPosition,
    handleAddTaskAtViewCenter,
  ]);

  const handleAddSibling = useCallback(() => {
    if (!rfInstance) {
      onAddTask?.();
      return;
    }
    const reference =
      selectedTask ?? findEndNode(taskNodes, taskEdges, parentId);
    if (!reference) {
      handleAddTaskAtViewCenter();
      return;
    }
    const predecessors = findPredecessors(reference.id, taskEdges, parentId);
    const existingNodes = rfInstance.getNodes();
    const refRf = existingNodes.find((n) => n.id === reference.id);
    const base = {
      x: reference.position.x,
      y: reference.position.y + (refRf?.height ?? 100) + 60,
    };
    const newPosition = findFreePosition(base, existingNodes);
    onAddTask?.(newPosition, predecessors);
    panToPosition(newPosition);
  }, [
    rfInstance,
    selectedTask,
    taskNodes,
    taskEdges,
    parentId,
    onAddTask,
    panToPosition,
    handleAddTaskAtViewCenter,
  ]);

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
        notifyAddTask: handleAddTaskAtViewCenter,
        performDelete: ({ context }) => {
          const { nodesToDelete } = context;
          if (!nodesToDelete || nodesToDelete.size === 0) return;
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
              ? `${count} 件のタスクを削除しました（u で元に戻す）`
              : "タスクを削除しました（u で元に戻す）",
            "success",
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

  const handleCopyNode = useCallback(async () => {
    if (isSelectionMode && selectedNodeIds.size > 0) {
      const data = exportSelectedNodes(taskNodes, taskEdges, selectedNodeIds);
      try {
        await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
        addToast(
          `${selectedNodeIds.size} 件のタスクをコピーしました`,
          "success",
        );
      } catch {
        addToast("コピーに失敗しました", "error");
      }
      return;
    }
    if (selectedTask) {
      const data = exportSubgraph(selectedTask.id, taskNodes, taskEdges);
      try {
        await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
        addToast("タスクをコピーしました", "success");
      } catch {
        addToast("コピーに失敗しました", "error");
      }
    }
  }, [
    isSelectionMode,
    selectedNodeIds,
    taskNodes,
    taskEdges,
    selectedTask,
    addToast,
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
          isEdgeSource: edgeSourceId === task.id,
        },
      })),
    [
      taskNodes,
      onToggleComplete,
      selectedNodeIds,
      isSelectionMode,
      selectedTask,
      edgeSourceId,
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

  const handleFormat = useCallback(() => {
    if (!rfInstance) return;

    const nodeDimensions = new Map<string, { width: number; height: number }>();
    const nodes = rfInstance.getNodes();

    for (const node of nodes) {
      if (node.width && node.height) {
        nodeDimensions.set(node.id, { width: node.width, height: node.height });
      }
    }

    const layoutedNodes = getLayoutedElements(
      taskNodes,
      taskEdges,
      nodeDimensions,
    );
    onTaskNodesChange?.(layoutedNodes);

    // Fit view after layout adjustment
    setTimeout(() => {
      rfInstance.fitView({ duration: 800 });
    }, 50);
  }, [taskNodes, taskEdges, onTaskNodesChange, rfInstance]);

  const handleSelectTaskFromKey = useCallback(
    (taskId: string | null) => {
      if (taskId && rfInstance) {
        const node = rfInstance.getNode(taskId);
        if (node) {
          const zoom = rfInstance.getZoom();
          const width = node.width ?? 0;
          const height = node.height ?? 0;
          rfInstance.setCenter(
            node.position.x + width / 2,
            node.position.y + height / 2,
            { zoom, duration: 300 },
          );
        }
      }
      onSelectTask?.(taskId);
    },
    [onSelectTask, rfInstance],
  );

  const handleEditTitleFromKey = useCallback(
    (taskId: string) => {
      onSelectTask?.(taskId);
      onRequestTitleFocus?.();
    },
    [onSelectTask, onRequestTitleFocus],
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
    onAddConnectedAfter: handleAddConnectedAfterSelected,
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
    onFormat: handleFormat,
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
        deleteKeyCode={null}
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
            titleFocusToken={titleFocusToken}
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

        <button
          type="button"
          onClick={handleFormat}
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
