import { Menu } from "lucide-react";
import { useState } from "react";
import type { ExportedData } from "../../lib/export-import-utils";
import type { TaskEdge } from "../../types/edge";
import type { TaskNode } from "../../types/task";
import type { TemplateTask } from "../../types/template";
import { GraphArea } from "../organisms/graph-area";
import { Header } from "../organisms/header";
import { MemoArea } from "../organisms/memo-area";
import { Sidebar } from "../organisms/sidebar";

type MobileTab = "graph" | "memo";

interface TaskDetailMobileLayoutProps {
  isRoot: boolean;
  hasParent: boolean;
  title: string;
  completed: boolean;
  memo: string;
  currentTaskId: string | null;
  currentNodes: TaskNode[];
  currentEdges: TaskEdge[];
  selectedTask: TaskNode | null;

  onTitleChange: (newTitle: string) => void;
  onToggleComplete: () => void;
  onBackClick: () => void;
  onPreviewClick: () => void;

  onNodesChange: (nodes: TaskNode[]) => void;
  onNodeClick: (taskId: string) => void;
  onNodeDoubleClick: (taskId: string) => void;
  onToggleCompleteNode: (taskId: string) => void;
  onNodeTitleChange: (taskId: string, newTitle: string) => void;
  onAddTask: (
    position?: { x: number; y: number },
    connectFromIds?: string[],
    connectToIds?: string[],
    removeEdgeIds?: string[],
  ) => string;
  onAddTemplate: (template: {
    tasks: (TemplateTask & { position: { x: number; y: number } })[];
    edges: { sourceIndex: number; targetIndex: number }[];
  }) => void;
  onAddEdge: (source: string, target: string) => void;
  onRemoveEdge: (edgeId: string) => void;
  onRemoveTask: (taskId: string) => void;
  onPaneClick: () => void;
  onImportTasks: (data: ExportedData) => void;
  onExportTask: (taskId: string) => void;
  onExportSelected: (selectedIds: Set<string>) => void;
  onSaveTemplate: (
    name: string,
    description: string,
    selectedNodeIds: Set<string>,
  ) => void;
  onConnectIsolated: () => void;
  onSelectTask: (taskId: string | null) => void;
  onGoToParent: () => void;
  onCopyCurrentMarkdown: () => Promise<void>;

  onMemoChange: (newMemo: string) => void;
  onCopyMemo: () => Promise<void>;
  onCopyExportPrompt: () => Promise<void>;
}

interface MobileTopBarProps {
  isRoot: boolean;
  hasParent: boolean;
  title: string;
  completed: boolean;
  tab: MobileTab;
  onOpenSidebar: () => void;
  onTabChange: (tab: MobileTab) => void;
  onTitleChange: (newTitle: string) => void;
  onToggleComplete: () => void;
  onBackClick: () => void;
  onPreviewClick: () => void;
}

function MobileTopBar({
  isRoot,
  hasParent,
  title,
  completed,
  tab,
  onOpenSidebar,
  onTabChange,
  onTitleChange,
  onToggleComplete,
  onBackClick,
  onPreviewClick,
}: MobileTopBarProps) {
  if (isRoot) {
    return (
      <div className="flex items-center gap-1 px-3 py-3 border-b bg-white shadow-sm flex-shrink-0">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="w-9 h-9 flex items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
          title="メニューを開く"
          aria-label="メニューを開く"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-base text-gray-800 ml-1">ittasu</h1>
      </div>
    );
  }
  return (
    <>
      <Header
        title={title}
        completed={completed}
        hasParent={hasParent}
        onTitleChange={onTitleChange}
        onToggleComplete={onToggleComplete}
        onBackClick={onBackClick}
        onPreviewClick={onPreviewClick}
        showMenuButton
        onMenuClick={onOpenSidebar}
      />
      <div
        className="flex border-b bg-white flex-shrink-0"
        role="tablist"
        aria-label="タスク詳細の表示"
      >
        <TabButton
          id="mobile-graph-tab"
          active={tab === "graph"}
          label="グラフ"
          controls="mobile-task-detail-panel"
          onClick={() => onTabChange("graph")}
          onMove={() => onTabChange("memo")}
          moveTargetId="mobile-memo-tab"
        />
        <TabButton
          id="mobile-memo-tab"
          active={tab === "memo"}
          label="メモ"
          controls="mobile-task-detail-panel"
          onClick={() => onTabChange("memo")}
          onMove={() => onTabChange("graph")}
          moveTargetId="mobile-graph-tab"
        />
      </div>
    </>
  );
}

function TabButton({
  id,
  active,
  label,
  controls,
  onClick,
  onMove,
  moveTargetId,
}: {
  id: string;
  active: boolean;
  label: string;
  controls: string;
  onClick: () => void;
  onMove: () => void;
  moveTargetId: string;
}) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (
      event.key !== "ArrowLeft" &&
      event.key !== "ArrowRight" &&
      event.key !== "Home" &&
      event.key !== "End"
    ) {
      return;
    }

    event.preventDefault();
    onMove();
    setTimeout(() => document.getElementById(moveTargetId)?.focus(), 0);
  };

  return (
    <button
      id={id}
      type="button"
      role="tab"
      aria-selected={active}
      aria-controls={controls}
      tabIndex={active ? 0 : -1}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={`relative min-h-12 flex-1 px-4 text-sm font-semibold transition-colors duration-200 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${
        active
          ? "bg-blue-50/60 text-blue-700 after:absolute after:inset-x-6 after:bottom-0 after:h-0.5 after:rounded-full after:bg-blue-600"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      {label}
    </button>
  );
}

export function TaskDetailMobileLayout(props: TaskDetailMobileLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("graph");

  const showGraph = props.isRoot || mobileTab === "graph";
  const showMemoFromGraph = () => setMobileTab("memo");
  const toggleMemoTab = () =>
    setMobileTab((t) => (t === "memo" ? "graph" : "memo"));

  return (
    <div className="flex flex-col h-[100dvh]">
      <Sidebar
        isMobile
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />
      <MobileTopBar
        isRoot={props.isRoot}
        hasParent={props.hasParent}
        title={props.title}
        completed={props.completed}
        tab={mobileTab}
        onOpenSidebar={() => setMobileSidebarOpen(true)}
        onTabChange={setMobileTab}
        onTitleChange={props.onTitleChange}
        onToggleComplete={props.onToggleComplete}
        onBackClick={props.onBackClick}
        onPreviewClick={props.onPreviewClick}
      />

      <div
        id="mobile-task-detail-panel"
        role="tabpanel"
        aria-labelledby={
          mobileTab === "graph" ? "mobile-graph-tab" : "mobile-memo-tab"
        }
        className="flex-1 min-h-0"
      >
        {showGraph ? (
          <GraphArea
            nodes={props.currentNodes}
            edges={props.currentEdges}
            selectedTask={props.selectedTask}
            onNodesChange={props.onNodesChange}
            onNodeClick={props.onNodeClick}
            onNodeDoubleClick={props.onNodeDoubleClick}
            onToggleComplete={props.onToggleCompleteNode}
            onTitleChange={props.onNodeTitleChange}
            onAddTask={props.onAddTask}
            onAddTemplate={props.onAddTemplate}
            onAddEdge={props.onAddEdge}
            onRemoveEdge={props.onRemoveEdge}
            onRemoveTask={props.onRemoveTask}
            onPaneClick={props.onPaneClick}
            onImportTasks={props.onImportTasks}
            onExportTask={props.onExportTask}
            onExportSelected={props.onExportSelected}
            onSaveTemplate={props.onSaveTemplate}
            onConnectIsolated={props.onConnectIsolated}
            parentId={props.currentTaskId}
            onSelectTask={props.onSelectTask}
            keyboardEnabled={false}
            onEscapeToParent={props.isRoot ? undefined : props.onGoToParent}
            onFocusMemo={props.isRoot ? undefined : showMemoFromGraph}
            onToggleMemo={props.isRoot ? undefined : toggleMemoTab}
            onCopyCurrent={
              props.isRoot ? undefined : props.onCopyCurrentMarkdown
            }
            onOpenPreview={props.isRoot ? undefined : props.onPreviewClick}
          />
        ) : (
          <MemoArea
            memo={props.memo}
            onMemoChange={props.onMemoChange}
            onCopyMemo={props.onCopyMemo}
            onCopyExportPrompt={props.onCopyExportPrompt}
          />
        )}
      </div>
    </div>
  );
}
