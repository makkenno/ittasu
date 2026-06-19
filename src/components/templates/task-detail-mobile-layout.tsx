import { Menu, Pencil } from "lucide-react";
import { useState } from "react";
import type { ExportedData } from "../../lib/export-import-utils";
import { isEscapeKey } from "../../lib/keyboard";
import { useEditSession } from "../../stores/use-edit-session";
import type { TaskEdge } from "../../types/edge";
import type { TaskNode } from "../../types/task";
import type { TemplateTask } from "../../types/template";
import { ThemeToggle } from "../molecules/common/theme-toggle";
import { GraphArea } from "../organisms/graph-area";
import { Header, type TaskHierarchyItem } from "../organisms/header";
import { MemoArea } from "../organisms/memo-area";
import { Sidebar } from "../organisms/sidebar";

type MobileTab = "graph" | "memo";

interface TaskDetailMobileLayoutProps {
  isRoot: boolean;
  hasParent: boolean;
  title: string;
  completed: boolean;
  memo: string;
  projectName: string;
  currentTaskId: string | null;
  currentNodes: TaskNode[];
  currentEdges: TaskEdge[];
  allNodes: TaskNode[];
  allEdges: TaskEdge[];
  selectedTask: TaskNode | null;
  hierarchy: TaskHierarchyItem[];

  onProjectNameChange: (newName: string) => void;
  onTitleChange: (newTitle: string) => void;
  onToggleComplete: () => void;
  onBackClick: () => void;
  onPreviewClick: () => void;
  onHierarchyNavigate: (taskId: string | null) => void;

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
  onReorderTasks: (taskIds: string[]) => void;
  onSelectTask: (taskId: string | null) => void;
  focusTaskId: string | null;
  onFocusTaskHandled: (taskId: string) => void;
  onGoToParent: () => void;
  onCopyCurrentMarkdown: () => Promise<void>;

  onMemoChange: (newMemo: string) => void;
  onCopyMemo: () => Promise<void>;
  onCopyExportPrompt: () => Promise<void>;
}

interface MobileTopBarProps {
  isRoot: boolean;
  hasParent: boolean;
  projectName: string;
  title: string;
  completed: boolean;
  tab: MobileTab;
  hierarchy: TaskHierarchyItem[];
  onOpenSidebar: () => void;
  onTabChange: (tab: MobileTab) => void;
  onProjectNameChange: (newName: string) => void;
  onTitleChange: (newTitle: string) => void;
  onToggleComplete: () => void;
  onBackClick: () => void;
  onPreviewClick: () => void;
  onHierarchyNavigate: (taskId: string | null) => void;
}

function MobileTopBar({
  isRoot,
  hasParent,
  projectName,
  title,
  completed,
  tab,
  hierarchy,
  onOpenSidebar,
  onTabChange,
  onProjectNameChange,
  onTitleChange,
  onToggleComplete,
  onBackClick,
  onPreviewClick,
  onHierarchyNavigate,
}: MobileTopBarProps) {
  if (isRoot) {
    return (
      <header className="flex min-h-16 flex-shrink-0 items-center gap-2 border-b bg-white px-3 py-2 shadow-sm">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          title="メニューを開く"
          aria-label="メニューを開く"
        >
          <Menu className="w-5 h-5" />
        </button>
        <MobileProjectName
          projectName={projectName}
          onChange={onProjectNameChange}
        />
        <ThemeToggle className="shrink-0" />
      </header>
    );
  }
  return (
    <>
      <Header
        title={title}
        completed={completed}
        hasParent={hasParent}
        hierarchy={hierarchy}
        onHierarchyNavigate={onHierarchyNavigate}
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

function MobileProjectName({
  projectName,
  onChange,
}: {
  projectName: string;
  onChange: (newName: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(projectName);
  const { handleFocus, handleBlur: endSession } = useEditSession();

  const finishEditing = () => {
    const trimmedName = draftName.trim();
    if (trimmedName && trimmedName !== projectName) {
      onChange(trimmedName);
    } else {
      setDraftName(projectName);
    }
    setIsEditing(false);
    endSession();
  };

  const cancelEditing = () => {
    setDraftName(projectName);
    setIsEditing(false);
    endSession();
  };

  if (isEditing) {
    return (
      <div className="min-w-0 flex-1">
        <label
          htmlFor="mobile-project-name"
          className="block text-[11px] font-medium leading-4 text-gray-500"
        >
          プロジェクト
        </label>
        <input
          // biome-ignore lint/a11y/noAutofocus: Editing starts from an explicit user action.
          autoFocus
          id="mobile-project-name"
          type="text"
          value={draftName}
          onChange={(event) => setDraftName(event.target.value)}
          onFocus={(event) => {
            handleFocus();
            event.currentTarget.select();
          }}
          onBlur={finishEditing}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) return;
            if (event.key === "Enter") {
              event.preventDefault();
              finishEditing();
            } else if (isEscapeKey(event)) {
              cancelEditing();
            }
          }}
          className="h-8 w-full rounded-md border border-blue-400 bg-white px-2 text-base font-bold leading-6 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraftName(projectName);
        setIsEditing(true);
      }}
      className="group min-w-0 flex-1 rounded-md py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      aria-label={`プロジェクト名「${projectName}」を編集`}
      title="プロジェクト名を編集"
    >
      <span className="block text-[11px] font-medium leading-4 text-gray-500">
        プロジェクト
      </span>
      <span className="flex min-w-0 items-center gap-1">
        <span className="truncate text-base font-bold leading-5 text-gray-900">
          {projectName}
        </span>
        <Pencil
          className="h-3.5 w-3.5 shrink-0 text-gray-400 transition-colors group-hover:text-gray-600"
          aria-hidden="true"
        />
      </span>
    </button>
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
        projectName={props.projectName}
        title={props.title}
        completed={props.completed}
        tab={mobileTab}
        hierarchy={props.hierarchy}
        onOpenSidebar={() => setMobileSidebarOpen(true)}
        onTabChange={setMobileTab}
        onProjectNameChange={props.onProjectNameChange}
        onTitleChange={props.onTitleChange}
        onToggleComplete={props.onToggleComplete}
        onBackClick={props.onBackClick}
        onPreviewClick={props.onPreviewClick}
        onHierarchyNavigate={props.onHierarchyNavigate}
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
            clipboardNodes={props.allNodes}
            clipboardEdges={props.allEdges}
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
            onReorderTasks={props.onReorderTasks}
            parentId={props.currentTaskId}
            onSelectTask={props.onSelectTask}
            focusTaskId={props.focusTaskId}
            onFocusTaskHandled={props.onFocusTaskHandled}
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
