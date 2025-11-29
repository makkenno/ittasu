import { useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import {
  exportSelectedNodes,
  exportSubgraph,
} from "../../lib/export-import-utils";
import { useTaskStore } from "../../stores/task-store";
import { GraphArea } from "../organisms/graph-area";
import { Header } from "../organisms/header";
import { MemoArea } from "../organisms/memo-area";
import { PreviewPage } from "./preview-page";

export function TaskDetailPage() {
  const currentTaskId = useTaskStore((state) => state.currentTaskId);
  const nodes = useTaskStore((state) => state.nodes);
  const edges = useTaskStore((state) => state.edges);
  const selectedTaskId = useTaskStore((state) => state.selectedTaskId);
  const updateTaskTitle = useTaskStore((state) => state.updateTaskTitle);
  const updateTaskMemo = useTaskStore((state) => state.updateTaskMemo);
  const toggleTaskComplete = useTaskStore((state) => state.toggleTaskComplete);
  const updateTaskPosition = useTaskStore((state) => state.updateTaskPosition);
  const setCurrentTaskId = useTaskStore((state) => state.setCurrentTaskId);
  const goToParent = useTaskStore((state) => state.goToParent);
  const goToNextTask = useTaskStore((state) => state.goToNextTask);
  const addChildTask = useTaskStore((state) => state.addChildTask);
  const addTemplate = useTaskStore((state) => state.addTemplate);
  const addEdge = useTaskStore((state) => state.addEdge);
  const removeEdge = useTaskStore((state) => state.removeEdge);
  const removeTask = useTaskStore((state) => state.removeTask);
  const selectTask = useTaskStore((state) => state.selectTask);
  const importSubgraph = useTaskStore((state) => state.importSubgraph);

  const [showPreview, setShowPreview] = useState(false);
  const [shouldAutoFocus, setShouldAutoFocus] = useState(false);

  // 現在のタスクを取得
  const currentTask = currentTaskId
    ? nodes.find((node) => node.id === currentTaskId)
    : null;
  const currentNodes = nodes.filter((node) => node.parentId === currentTaskId);
  const currentEdges = edges.filter((edge) => edge.parentId === currentTaskId);

  const isRoot = currentTaskId === null;
  const hasParent = !isRoot;

  const title = currentTask?.title || "無題";
  const completed = currentTask?.completed ?? false;
  const memo = currentTask?.memo ?? "";

  const selectedTask = nodes.find((n) => n.id === selectedTaskId) ?? null;

  const handleTitleChange = (newTitle: string) => {
    if (currentTaskId) {
      updateTaskTitle(currentTaskId, newTitle);
    }
  };

  const handleToggleComplete = () => {
    if (currentTaskId) {
      toggleTaskComplete(currentTaskId);
    }
  };

  const handleBackClick = () => {
    goToParent();
  };

  const handleNextTaskClick = () => {
    goToNextTask();
  };

  const handleNodeClick = (taskId: string) => {
    setShouldAutoFocus(false);
    selectTask(taskId);
  };

  const handleNodeDoubleClick = (taskId: string) => {
    setCurrentTaskId(taskId);
  };

  const handleToggleCompleteNode = (taskId: string) => {
    toggleTaskComplete(taskId);
  };

  const handleNodeTitleChange = (taskId: string, newTitle: string) => {
    updateTaskTitle(taskId, newTitle);
  };

  const handleAddTask = (position?: { x: number; y: number }) => {
    setShouldAutoFocus(true);
    addChildTask(position);
  };

  const handleAddTemplate = (template: {
    tasks: {
      title: string;
      memo?: string;
      position: { x: number; y: number };
    }[];
    edges: { sourceIndex: number; targetIndex: number }[];
  }) => {
    setShouldAutoFocus(false); // 複数追加時はフォーカスしない
    addTemplate(template);
  };

  const handleMemoChange = (newMemo: string) => {
    if (currentTaskId) {
      updateTaskMemo(currentTaskId, newMemo);
    }
  };

  const handleNodesChange = (updatedNodes: typeof currentNodes) => {
    for (const node of updatedNodes) {
      const originalNode = currentNodes.find((n) => n.id === node.id);
      if (
        originalNode &&
        (originalNode.position.x !== node.position.x ||
          originalNode.position.y !== node.position.y)
      ) {
        updateTaskPosition(node.id, node.position);
      }
    }
  };

  const handlePreviewClick = () => {
    setShowPreview(true);
  };

  const handleBackFromPreview = () => {
    setShowPreview(false);
  };

  const handleCopyMemo = async () => {
    if (!currentTaskId) return;

    const task = nodes.find((node) => node.id === currentTaskId);
    if (!task) return;

    const memoMarkdown = `# ${task.title}\n\n${task.memo}`;
    try {
      await navigator.clipboard.writeText(memoMarkdown);
    } catch (error) {
      console.error("Failed to copy memo:", error);
    }
  };

  const handlePaneClick = () => {
    selectTask(null);
  };

  const handleExportTask = async (taskId: string) => {
    const data = exportSubgraph(taskId, nodes, edges);
    const json = JSON.stringify(data, null, 2);
    try {
      await navigator.clipboard.writeText(json);
      alert("クリップボードにコピーしました");
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      alert("コピーに失敗しました");
    }
  };

  const handleExportSelected = async (selectedIds: Set<string>) => {
    const data = exportSelectedNodes(nodes, edges, selectedIds);
    const json = JSON.stringify(data, null, 2);
    try {
      await navigator.clipboard.writeText(json);
      alert("クリップボードにコピーしました");
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      alert("コピーに失敗しました");
    }
  };

  if (showPreview) {
    return (
      <PreviewPage
        nodes={nodes}
        edges={edges}
        currentTaskId={currentTaskId}
        onBack={handleBackFromPreview}
        onTitleChange={updateTaskTitle}
        onMemoChange={updateTaskMemo}
      />
    );
  }

  return (
    <div className="flex flex-col h-[100dvh]">
      {!isRoot && (
        <Header
          title={title}
          completed={completed}
          hasParent={hasParent}
          onTitleChange={handleTitleChange}
          onToggleComplete={handleToggleComplete}
          onBackClick={handleBackClick}
          onNextTaskClick={handleNextTaskClick}
          onPreviewClick={handlePreviewClick}
        />
      )}

      {isRoot ? (
        <div className="flex-1 min-h-0">
          <GraphArea
            nodes={currentNodes}
            edges={currentEdges}
            selectedTask={selectedTask}
            onNodesChange={handleNodesChange}
            onNodeClick={handleNodeClick}
            onNodeDoubleClick={handleNodeDoubleClick}
            onToggleComplete={handleToggleCompleteNode}
            onTitleChange={handleNodeTitleChange}
            onAddTask={handleAddTask}
            onAddTemplate={handleAddTemplate}
            onAddEdge={addEdge}
            onRemoveEdge={removeEdge}
            onRemoveTask={removeTask}
            onPaneClick={handlePaneClick}
            onImportTasks={importSubgraph}
            onExportTask={handleExportTask}
            onExportSelected={handleExportSelected}
            parentId={currentTaskId}
            shouldAutoFocus={shouldAutoFocus}
          />
        </div>
      ) : (
        <div className="flex-1 min-h-0">
          <PanelGroup direction="vertical">
            <Panel defaultSize={60} minSize={30}>
              <GraphArea
                nodes={currentNodes}
                edges={currentEdges}
                selectedTask={selectedTask}
                onNodesChange={handleNodesChange}
                onNodeClick={handleNodeClick}
                onNodeDoubleClick={handleNodeDoubleClick}
                onToggleComplete={handleToggleCompleteNode}
                onTitleChange={handleNodeTitleChange}
                onAddTask={handleAddTask}
                onAddTemplate={handleAddTemplate}
                onAddEdge={addEdge}
                onRemoveEdge={removeEdge}
                onRemoveTask={removeTask}
                onPaneClick={handlePaneClick}
                onImportTasks={importSubgraph}
                onExportTask={handleExportTask}
                onExportSelected={handleExportSelected}
                parentId={currentTaskId}
                shouldAutoFocus={shouldAutoFocus}
              />
            </Panel>
            <PanelResizeHandle className="h-2 bg-gray-200 hover:bg-blue-400 transition-colors cursor-row-resize flex items-center justify-center">
              <div className="w-12 h-1 bg-gray-400 rounded-full" />
            </PanelResizeHandle>
            <Panel defaultSize={40} minSize={20}>
              <MemoArea
                memo={memo}
                onMemoChange={handleMemoChange}
                onCopyMemo={handleCopyMemo}
              />
            </Panel>
          </PanelGroup>
        </div>
      )}
    </div>
  );
}
