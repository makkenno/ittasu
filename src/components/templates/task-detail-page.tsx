import { useCallback, useEffect, useRef, useState } from "react";
import {
  type ImperativePanelHandle,
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";
import { tinykeys } from "tinykeys";
import {
  exportSelectedNodes,
  exportSubgraph,
} from "../../lib/export-import-utils";
import { generateMarkdown } from "../../lib/markdown-utils";
import { useIsMobile } from "../../lib/use-is-mobile";
import { useTaskStore } from "../../stores/task-store";
import { useToastStore } from "../../stores/toast-store";
import type { TemplateTask } from "../../types/template";
import { ShortcutHelpDialog } from "../molecules/common/shortcut-help-dialog";
import { GraphArea } from "../organisms/graph-area";
import {
  Header,
  type HeaderHandle,
  type TaskHierarchyItem,
} from "../organisms/header";
import { MemoArea, type MemoAreaHandle } from "../organisms/memo-area";
import { Sidebar, type SidebarHandle } from "../organisms/sidebar";
import { PreviewPage } from "./preview-page";
import { TaskDetailMobileLayout } from "./task-detail-mobile-layout";

type FocusArea = "graph" | "sidebar";

const getProjectName = (project: { name: string } | undefined) =>
  project?.name || "プロジェクト";

const renameSelectedProject = (
  projectId: string | null,
  newName: string,
  renameProject: (projectId: string, name: string) => void,
) => {
  if (projectId) renameProject(projectId, newName);
};

export function TaskDetailPage() {
  const currentTaskId = useTaskStore((state) => state.currentTaskId);
  const currentProjectId = useTaskStore((state) => state.currentProjectId);
  const projects = useTaskStore((state) => state.projects);
  const nodes = useTaskStore((state) => state.nodes);
  const edges = useTaskStore((state) => state.edges);
  const selectedTaskId = useTaskStore((state) => state.selectedTaskId);
  const renameProject = useTaskStore((state) => state.renameProject);
  const updateTaskTitle = useTaskStore((state) => state.updateTaskTitle);
  const updateTaskMemo = useTaskStore((state) => state.updateTaskMemo);
  const toggleTaskComplete = useTaskStore((state) => state.toggleTaskComplete);
  const updateTaskPosition = useTaskStore((state) => state.updateTaskPosition);
  const setCurrentTaskId = useTaskStore((state) => state.setCurrentTaskId);
  const goToParent = useTaskStore((state) => state.goToParent);
  const addChildTask = useTaskStore((state) => state.addChildTask);
  const addTemplate = useTaskStore((state) => state.addTemplate);
  const saveTemplate = useTaskStore((state) => state.saveTemplate);
  const addEdge = useTaskStore((state) => state.addEdge);
  const connectIsolatedTasks = useTaskStore(
    (state) => state.connectIsolatedTasks,
  );
  const reorderLinearTasks = useTaskStore((state) => state.reorderLinearTasks);
  const removeEdge = useTaskStore((state) => state.removeEdge);
  const removeTask = useTaskStore((state) => state.removeTask);
  const selectTask = useTaskStore((state) => state.selectTask);
  const importSubgraph = useTaskStore((state) => state.importSubgraph);
  const addToast = useToastStore((state) => state.addToast);

  const isMobile = useIsMobile();
  const [showPreview, setShowPreview] = useState(false);
  const [focusArea, setFocusArea] = useState<FocusArea>("graph");
  const [showHelp, setShowHelp] = useState(false);
  const [focusTaskId, setFocusTaskId] = useState<string | null>(null);
  const memoPanelRef = useRef<ImperativePanelHandle>(null);
  const headerRef = useRef<HeaderHandle>(null);
  const memoAreaRef = useRef<MemoAreaHandle>(null);
  const sidebarRef = useRef<SidebarHandle>(null);

  const requestMemoFocus = useCallback(() => {
    memoPanelRef.current?.expand();
    requestAnimationFrame(() => memoAreaRef.current?.focusEditor());
  }, []);
  const toggleMemoVisible = useCallback(() => {
    const panel = memoPanelRef.current;
    if (!panel) return;
    if (panel.isCollapsed()) panel.expand();
    else panel.collapse();
  }, []);
  const requestHeaderTitleEdit = useCallback(
    () => headerRef.current?.editTitle(),
    [],
  );

  const focusSidebar = useCallback(() => setFocusArea("sidebar"), []);
  const focusGraph = useCallback(() => setFocusArea("graph"), []);

  useEffect(() => {
    if (isMobile) return;
    const unsubGlobal = tinykeys(
      window,
      {
        "Control+e": (event) => {
          event.preventDefault();
          const active = document.activeElement;
          if (active instanceof HTMLElement) active.blur();
          if (focusArea === "sidebar") {
            setFocusArea("graph");
          } else {
            sidebarRef.current?.activate();
            setFocusArea("sidebar");
          }
        },
        "Control+b": (event) => {
          event.preventDefault();
          sidebarRef.current?.toggle();
        },
      },
      {
        capture: true,
        ignore: (event) => event.repeat || event.isComposing,
      },
    );
    const unsubHelp = tinykeys(window, {
      "Shift+?": (event) => {
        event.preventDefault();
        setShowHelp((v) => !v);
      },
      u: (event) => {
        event.preventDefault();
        useTaskStore.temporal.getState().undo();
      },
      "Control+r": (event) => {
        event.preventDefault();
        useTaskStore.temporal.getState().redo();
      },
    });
    return () => {
      unsubGlobal();
      unsubHelp();
    };
  }, [isMobile, focusArea]);

  // 現在のタスクを取得
  const currentTask = currentTaskId
    ? nodes.find((node) => node.id === currentTaskId)
    : null;
  const currentNodes = nodes.filter(
    (node) =>
      node.parentId === currentTaskId &&
      (currentTaskId !== null || node.projectId === currentProjectId),
  );
  const currentNodeIds = new Set(currentNodes.map((n) => n.id));
  const currentEdges = edges.filter(
    (edge) =>
      edge.parentId === currentTaskId &&
      currentNodeIds.has(edge.source) &&
      currentNodeIds.has(edge.target),
  );

  const isRoot = currentTaskId === null;
  const hasParent = !isRoot;

  const title = currentTask?.title || "無題";
  const completed = currentTask?.completed ?? false;
  const memo = currentTask?.memo ?? "";
  const currentProject = projects.find(
    (project) => project.id === currentProjectId,
  );
  const projectName = getProjectName(currentProject);
  const ancestorTasks = [];
  const visitedTaskIds = new Set<string>();
  let ancestorId = currentTask?.parentId ?? null;

  while (ancestorId && !visitedTaskIds.has(ancestorId)) {
    visitedTaskIds.add(ancestorId);
    const ancestor = nodes.find((node) => node.id === ancestorId);
    if (!ancestor) break;
    ancestorTasks.unshift(ancestor);
    ancestorId = ancestor.parentId;
  }

  const hierarchy: TaskHierarchyItem[] = [
    {
      id: null,
      label: projectName,
    },
    ...ancestorTasks.map((task) => ({
      id: task.id,
      label: task.title || "無題",
    })),
  ];

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

  const handleNodeClick = (taskId: string) => {
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

  const handleAddTask = (
    position?: { x: number; y: number },
    connectFromIds?: string[],
    connectToIds?: string[],
    removeEdgeIds?: string[],
  ) => {
    const taskId = addChildTask(
      position,
      connectFromIds,
      connectToIds,
      removeEdgeIds,
    );
    setFocusTaskId(taskId);
    return taskId;
  };

  const handleFocusTaskHandled = useCallback((taskId: string) => {
    setFocusTaskId((current) => (current === taskId ? null : current));
  }, []);

  const handleAddTemplate = (template: {
    tasks: (TemplateTask & { position: { x: number; y: number } })[];
    edges: { sourceIndex: number; targetIndex: number }[];
  }) => {
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
        !originalNode ||
        originalNode.position.x !== node.position.x ||
        originalNode.position.y !== node.position.y
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

  const handleCopyCurrentMarkdown = useCallback(async () => {
    if (!currentTaskId) return;
    const markdown = generateMarkdown(nodes, edges, currentTaskId);
    try {
      await navigator.clipboard.writeText(markdown);
      addToast("現在のタスクをマークダウンでコピーしました", "success");
    } catch (error) {
      console.error("Failed to copy markdown:", error);
      addToast("コピーに失敗しました", "error");
    }
  }, [currentTaskId, nodes, edges, addToast]);

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

  const handleCopyExportPrompt = async () => {
    if (!currentTaskId) return;

    const task = nodes.find((node) => node.id === currentTaskId);
    if (!task) return;

    const memoContent = `# ${task.title}\n\n${task.memo}`;
    const prompt = `以下のメモの内容を読み取り、情報を階層的なツリー構造に整理したうえで、指定のJSONフォーマットに変換してください。タスク管理だけでなく、知識の整理・アイデアの構造化・物事の分類など、あらゆる情報を構造化するために使えるツールです。

## 出力するJSONフォーマット
\`\`\`json
{
  "version": 1,
  "nodes": [
    {
      "id": "node-1",
      "title": "ノードのタイトル",
      "memo": "",
      "completed": false,
      "position": { "x": 0, "y": 0 },
      "parentId": null,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "completedAt": null
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "node-1",
      "target": "node-2",
      "parentId": null
    }
  ]
}
\`\`\`

## 整理・変換ルール
- メモの内容から意図・文脈・概念の関係性を読み取り、適切なツリー構造に整理してください（見出しやリストを機械的に変換するのではなく、情報の本質的な構造を考えてください）
- 階層構造はノードのparentIdで表現してください（トップレベルはnull）
- edgesは同じ階層（同じparentId）のノード同士を繋ぐものです。sourceとtargetには同階層のノードのidを設定し、parentIdにはその階層を管理する親ノードのidを設定してください（トップレベルならnull）
- idはユニークな文字列（例: "node-1", "node-2"）を使用してください
- positionはx: 階層ごとに200ずつ増加、y: 兄弟順に150ずつ増加するよう配置してください
- 各ノードのmemoには、その項目に関連する詳細情報・背景・補足・注意点などをなるべく詳しく記載してください
- completedはfalse、createdAt/updatedAtは現在時刻のISO文字列にしてください
- JSONのみを出力してください（説明文不要）

## 整理するメモ

${memoContent}`;
    try {
      await navigator.clipboard.writeText(prompt);
    } catch (error) {
      console.error("Failed to copy export prompt:", error);
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
      addToast("クリップボードにコピーしました", "success");
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      addToast("コピーに失敗しました", "error");
    }
  };

  const handleExportSelected = async (selectedIds: Set<string>) => {
    const data = exportSelectedNodes(nodes, edges, selectedIds);
    const json = JSON.stringify(data, null, 2);
    try {
      await navigator.clipboard.writeText(json);
      addToast("クリップボードにコピーしました", "success");
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      addToast("コピーに失敗しました", "error");
    }
  };

  const handleSaveTemplate = (
    name: string,
    description: string,
    selectedNodeIds: Set<string>,
  ) => {
    saveTemplate(name, description, selectedNodeIds);
    addToast("テンプレートを保存しました", "success");
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

  if (isMobile) {
    return (
      <TaskDetailMobileLayout
        isRoot={isRoot}
        hasParent={hasParent}
        title={title}
        completed={completed}
        memo={memo}
        projectName={projectName}
        currentTaskId={currentTaskId}
        currentNodes={currentNodes}
        currentEdges={currentEdges}
        selectedTask={selectedTask}
        hierarchy={hierarchy}
        onProjectNameChange={(newName) =>
          renameSelectedProject(currentProjectId, newName, renameProject)
        }
        onTitleChange={handleTitleChange}
        onToggleComplete={handleToggleComplete}
        onBackClick={handleBackClick}
        onPreviewClick={handlePreviewClick}
        onHierarchyNavigate={setCurrentTaskId}
        onNodesChange={handleNodesChange}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        onToggleCompleteNode={handleToggleCompleteNode}
        onNodeTitleChange={handleNodeTitleChange}
        onAddTask={handleAddTask}
        onAddTemplate={handleAddTemplate}
        onAddEdge={addEdge}
        onRemoveEdge={removeEdge}
        onRemoveTask={removeTask}
        onPaneClick={handlePaneClick}
        onImportTasks={importSubgraph}
        onExportTask={handleExportTask}
        onExportSelected={handleExportSelected}
        onSaveTemplate={handleSaveTemplate}
        onConnectIsolated={connectIsolatedTasks}
        onReorderTasks={reorderLinearTasks}
        onSelectTask={selectTask}
        focusTaskId={focusTaskId}
        onFocusTaskHandled={handleFocusTaskHandled}
        onGoToParent={goToParent}
        onCopyCurrentMarkdown={handleCopyCurrentMarkdown}
        onMemoChange={handleMemoChange}
        onCopyMemo={handleCopyMemo}
        onCopyExportPrompt={handleCopyExportPrompt}
      />
    );
  }

  return (
    <div className="flex h-[100dvh]">
      <Sidebar
        ref={sidebarRef}
        focused={focusArea === "sidebar"}
        onFocus={focusSidebar}
        onBlur={focusGraph}
      />
      <div className="flex flex-col flex-1 min-w-0">
        {!isRoot && (
          <Header
            ref={headerRef}
            title={title}
            completed={completed}
            hasParent={hasParent}
            hierarchy={hierarchy}
            onHierarchyNavigate={setCurrentTaskId}
            onTitleChange={handleTitleChange}
            onToggleComplete={handleToggleComplete}
            onBackClick={handleBackClick}
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
              onSaveTemplate={handleSaveTemplate}
              onConnectIsolated={connectIsolatedTasks}
              onReorderTasks={reorderLinearTasks}
              parentId={currentTaskId}
              keyboardEnabled={focusArea === "graph"}
              onSelectTask={selectTask}
              focusTaskId={focusTaskId}
              onFocusTaskHandled={handleFocusTaskHandled}
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
                  onSaveTemplate={handleSaveTemplate}
                  onConnectIsolated={connectIsolatedTasks}
                  onReorderTasks={reorderLinearTasks}
                  parentId={currentTaskId}
                  keyboardEnabled={focusArea === "graph"}
                  onSelectTask={selectTask}
                  focusTaskId={focusTaskId}
                  onFocusTaskHandled={handleFocusTaskHandled}
                  onEscapeToParent={goToParent}
                  onFocusMemo={requestMemoFocus}
                  onToggleMemo={toggleMemoVisible}
                  onEditCurrentTitle={requestHeaderTitleEdit}
                  onCopyCurrent={handleCopyCurrentMarkdown}
                  onOpenPreview={handlePreviewClick}
                />
              </Panel>
              <PanelResizeHandle className="h-2 bg-gray-200 hover:bg-blue-400 transition-colors cursor-row-resize flex items-center justify-center">
                <div className="w-12 h-1 bg-gray-400 rounded-full" />
              </PanelResizeHandle>
              <Panel
                ref={memoPanelRef}
                defaultSize={40}
                minSize={20}
                collapsible={true}
              >
                <MemoArea
                  ref={memoAreaRef}
                  memo={memo}
                  onMemoChange={handleMemoChange}
                  onCopyMemo={handleCopyMemo}
                  onCopyExportPrompt={handleCopyExportPrompt}
                />
              </Panel>
            </PanelGroup>
          </div>
        )}
      </div>
      <ShortcutHelpDialog
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
      />
    </div>
  );
}
