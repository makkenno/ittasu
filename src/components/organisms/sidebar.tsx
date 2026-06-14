import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Folder,
  Plus,
  Trash2,
} from "lucide-react";
import {
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { tinykeys } from "tinykeys";
import { isEscapeKey } from "../../lib/keyboard";
import { generateProjectMarkdown } from "../../lib/markdown-utils";
import { useTaskStore } from "../../stores/task-store";
import { useToastStore } from "../../stores/toast-store";
import { useEditSession } from "../../stores/use-edit-session";
import type { Project } from "../../types/project";

interface ProjectListItemProps {
  project: Project;
  isActive: boolean;
  isCursor: boolean;
  showCursor: boolean;
  taskCount: number;
  isEditing: boolean;
  editingName: string;
  copied: boolean;
  canDelete: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  itemRef: RefObject<HTMLButtonElement | null>;
  onSelect: () => void;
  onStartEdit: () => void;
  onEditingNameChange: (name: string) => void;
  onRenameSubmit: () => void;
  onCancelEdit: () => void;
  onCopy: () => void;
  onRequestDelete: () => void;
}

function ProjectListItem({
  project,
  isActive,
  isCursor,
  showCursor,
  taskCount,
  isEditing,
  editingName,
  copied,
  canDelete,
  inputRef,
  itemRef,
  onSelect,
  onStartEdit,
  onEditingNameChange,
  onRenameSubmit,
  onCancelEdit,
  onCopy,
  onRequestDelete,
}: ProjectListItemProps) {
  const { handleFocus, handleBlur } = useEditSession();
  const cursorClasses =
    showCursor && isCursor
      ? "ring-2 ring-blue-400 ring-offset-1 ring-offset-gray-50"
      : "";
  return (
    <button
      ref={itemRef}
      type="button"
      className={`group w-full text-left flex items-center gap-1.5 mx-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
        isActive
          ? "bg-blue-100 text-blue-700"
          : "text-gray-600 hover:bg-gray-100"
      } ${cursorClasses}`}
      onClick={onSelect}
      onDoubleClick={(e) => {
        e.preventDefault();
        onStartEdit();
      }}
    >
      <Folder
        className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? "text-blue-500" : "text-gray-400"}`}
      />
      {isEditing ? (
        <input
          ref={inputRef}
          className="flex-1 text-sm bg-white border border-blue-300 rounded px-1 py-0 outline-none min-w-0"
          value={editingName}
          onChange={(e) => onEditingNameChange(e.target.value)}
          onBlur={() => {
            onRenameSubmit();
            handleBlur();
          }}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing) return;
            if (e.key === "Enter") {
              e.preventDefault();
              onRenameSubmit();
            }
            if (isEscapeKey(e)) onCancelEdit();
          }}
          onClick={(e) => e.stopPropagation()}
          onFocus={(e) => {
            handleFocus();
            e.target.select();
          }}
        />
      ) : (
        <>
          <span className="flex-1 text-sm truncate">{project.name}</span>
          {taskCount > 0 && (
            <span
              className={`text-xs flex-shrink-0 ${isActive ? "text-blue-400" : "text-gray-400"}`}
            >
              {taskCount}
            </span>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCopy();
            }}
            className={`opacity-0 group-hover:opacity-100 flex-shrink-0 transition-all ${
              copied
                ? "text-green-600 opacity-100"
                : "text-gray-400 hover:text-blue-500"
            }`}
            title="マークダウンとしてコピー"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
          {canDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRequestDelete();
              }}
              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 flex-shrink-0 transition-all"
              title="削除"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </>
      )}
    </button>
  );
}

interface SidebarProps {
  focused?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  collapseToggleToken?: number;
  isMobile?: boolean;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({
  focused = false,
  onFocus,
  onBlur,
  collapseToggleToken = 0,
  isMobile = false,
  mobileOpen = false,
  onMobileClose,
}: SidebarProps = {}) {
  const projects = useTaskStore((s) => s.projects);
  const currentProjectId = useTaskStore((s) => s.currentProjectId);
  const nodes = useTaskStore((s) => s.nodes);
  const edges = useTaskStore((s) => s.edges);
  const addProject = useTaskStore((s) => s.addProject);
  const renameProject = useTaskStore((s) => s.renameProject);
  const deleteProject = useTaskStore((s) => s.deleteProject);
  const setCurrentProjectId = useTaskStore((s) => s.setCurrentProjectId);
  const addToast = useToastStore((s) => s.addToast);

  const [collapsed, setCollapsed] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [cursorIndex, setCursorIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<Map<string, HTMLButtonElement | null>>(new Map());

  useEffect(() => {
    if (editingId) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editingId]);

  const prevFocusedRef = useRef(focused);
  useEffect(() => {
    const becameFocused = focused && !prevFocusedRef.current;
    prevFocusedRef.current = focused;
    if (becameFocused) setCollapsed(false);
  }, [focused]);

  const lastCollapseTokenRef = useRef(collapseToggleToken);
  useEffect(() => {
    if (collapseToggleToken !== lastCollapseTokenRef.current) {
      setCollapsed((c) => !c);
    }
    lastCollapseTokenRef.current = collapseToggleToken;
  }, [collapseToggleToken]);

  useEffect(() => {
    if (!focused) return;
    const idx = projects.findIndex((p) => p.id === currentProjectId);
    if (idx >= 0) setCursorIndex(idx);
  }, [focused, projects, currentProjectId]);

  useEffect(() => {
    if (!focused) return;
    const project = projects[cursorIndex];
    if (!project) return;
    const el = itemRefs.current.get(project.id);
    el?.scrollIntoView({ block: "nearest" });
  }, [focused, cursorIndex, projects]);

  const handleAddProject = useCallback(() => {
    if (collapsed) setCollapsed(false);
    const newId = `project-${Date.now()}`;
    addProject(newId, "新しいプロジェクト");
  }, [collapsed, addProject]);

  const handleRenameSubmit = () => {
    if (editingId) {
      const trimmed = editingName.trim();
      if (trimmed) {
        renameProject(editingId, trimmed);
      } else {
        const project = projects.find((p) => p.id === editingId);
        if (project) setEditingName(project.name);
      }
    }
    setEditingId(null);
  };

  const handleDeleteProject = useCallback(
    (projectId: string) => {
      if (projects.length <= 1) return;
      deleteProject(projectId);
      addToast("プロジェクトを削除しました（u で元に戻す）", "success");
    },
    [projects.length, deleteProject, addToast],
  );

  const handleCopyProject = useCallback(
    async (projectId: string) => {
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;
      const markdown = generateProjectMarkdown(project, nodes, edges);
      try {
        await navigator.clipboard.writeText(markdown);
        setCopiedId(projectId);
        setTimeout(() => setCopiedId(null), 2000);
        addToast(
          `「${project.name}」をマークダウンでコピーしました`,
          "success",
        );
      } catch (error) {
        console.error("Failed to copy project markdown:", error);
        addToast("コピーに失敗しました", "error");
      }
    },
    [projects, nodes, edges, addToast],
  );

  const getRootTaskCount = (projectId: string) =>
    nodes.filter((n) => n.parentId === null && n.projectId === projectId)
      .length;

  useEffect(() => {
    if (!focused) return;
    if (editingId !== null) return;

    const openCurrent = () => {
      const p = projects[cursorIndex];
      if (p) setCurrentProjectId(p.id);
    };

    const handle = (fn: () => void) => (event: KeyboardEvent) => {
      event.preventDefault();
      fn();
    };

    const moveDown = () =>
      setCursorIndex((i) => Math.min(projects.length - 1, i + 1));
    const moveUp = () => setCursorIndex((i) => Math.max(0, i - 1));
    const blur = () => onBlur?.();

    return tinykeys(window, {
      j: handle(moveDown),
      ArrowDown: handle(moveDown),
      k: handle(moveUp),
      ArrowUp: handle(moveUp),
      Enter: handle(openCurrent),
      l: handle(() => {
        openCurrent();
        blur();
      }),
      ArrowRight: handle(() => {
        openCurrent();
        blur();
      }),
      h: handle(blur),
      ArrowLeft: handle(blur),
      Escape: handle(blur),
      "Control+[": handle(blur),
      n: handle(handleAddProject),
      r: handle(() => {
        const p = projects[cursorIndex];
        if (!p) return;
        setEditingId(p.id);
        setEditingName(p.name);
      }),
      d: handle(() => {
        const p = projects[cursorIndex];
        if (!p) return;
        handleDeleteProject(p.id);
      }),
      y: handle(() => {
        const p = projects[cursorIndex];
        if (!p) return;
        handleCopyProject(p.id);
      }),
    });
  }, [
    focused,
    projects,
    cursorIndex,
    editingId,
    setCurrentProjectId,
    onBlur,
    handleAddProject,
    handleDeleteProject,
    handleCopyProject,
  ]);

  const focusedClasses =
    !isMobile && focused
      ? "border-blue-500 bg-blue-50/60 shadow-[inset_4px_0_0_0_rgb(59,130,246)]"
      : "border-gray-200 bg-gray-50";

  if (isMobile) {
    return (
      <>
        {mobileOpen && (
          <button
            type="button"
            aria-label="サイドバーを閉じる"
            onClick={onMobileClose}
            className="fixed inset-0 z-[90] bg-black/40"
          />
        )}
        <div
          className={`fixed top-0 left-0 z-[100] h-[100dvh] w-64 max-w-[80vw] border-r border-gray-200 bg-gray-50 flex flex-col text-left transition-transform duration-200 ease-out ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Header */}
          <div className="flex items-center px-4 py-3 justify-between border-b border-gray-200">
            <h1 className="font-bold text-base text-gray-800">ittasu</h1>
            <button
              type="button"
              onClick={onMobileClose}
              className="text-gray-400 hover:text-gray-600 w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 transition-colors flex-shrink-0"
              title="サイドバーを閉じる"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          {/* Project list */}
          <div className="flex-1 overflow-y-auto py-2">
            <div className="flex items-center justify-between px-3 py-1 mb-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                プロジェクト
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddProject();
                }}
                className="text-gray-400 hover:text-gray-600 w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 transition-colors"
                title="プロジェクトを追加"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {projects.map((project, index) => (
              <ProjectListItem
                key={project.id}
                project={project}
                isActive={project.id === currentProjectId}
                isCursor={index === cursorIndex}
                showCursor={false}
                taskCount={getRootTaskCount(project.id)}
                isEditing={editingId === project.id}
                editingName={editingName}
                copied={copiedId === project.id}
                canDelete={projects.length > 1}
                inputRef={inputRef}
                itemRef={{
                  get current() {
                    return itemRefs.current.get(project.id) ?? null;
                  },
                  set current(value) {
                    if (value) {
                      itemRefs.current.set(project.id, value);
                    } else {
                      itemRefs.current.delete(project.id);
                    }
                  },
                }}
                onSelect={() => {
                  setCurrentProjectId(project.id);
                  setCursorIndex(index);
                  onMobileClose?.();
                }}
                onStartEdit={() => {
                  setEditingId(project.id);
                  setEditingName(project.name);
                }}
                onEditingNameChange={setEditingName}
                onRenameSubmit={handleRenameSubmit}
                onCancelEdit={() => setEditingId(null)}
                onCopy={() => handleCopyProject(project.id)}
                onRequestDelete={() => handleDeleteProject(project.id)}
              />
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <div
      onMouseDownCapture={onFocus}
      className={`h-full border-r flex flex-col flex-shrink-0 transition-all duration-150 text-left ${
        collapsed ? "w-10" : "w-52"
      } ${focusedClasses}`}
    >
      {/* Header */}
      <div
        className={`flex items-center border-b border-gray-200 ${collapsed ? "justify-center py-3" : "px-4 py-3 justify-between"}`}
      >
        {!collapsed && (
          <h1 className="font-bold text-base text-gray-800">ittasu</h1>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setCollapsed((c) => !c);
          }}
          className="text-gray-400 hover:text-gray-600 w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 transition-colors flex-shrink-0"
          title={collapsed ? "サイドバーを開く" : "サイドバーを閉じる"}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Project list */}
      <div className="flex-1 overflow-y-auto py-2">
        {collapsed ? (
          /* Collapsed: icon-only list */
          <div className="flex flex-col items-center gap-1 px-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleAddProject();
              }}
              className="text-gray-400 hover:text-gray-600 w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 transition-colors"
              title="プロジェクトを追加"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            {projects.map((project) => {
              const isActive = project.id === currentProjectId;
              return (
                <button
                  key={project.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentProjectId(project.id);
                  }}
                  title={project.name}
                  className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
                    isActive
                      ? "bg-blue-100 text-blue-500"
                      : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  }`}
                >
                  <Folder className="w-4 h-4" />
                </button>
              );
            })}
          </div>
        ) : (
          /* Expanded: full list */
          <>
            <div className="flex items-center justify-between px-3 py-1 mb-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                プロジェクト
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddProject();
                }}
                className="text-gray-400 hover:text-gray-600 w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 transition-colors"
                title="プロジェクトを追加"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            {projects.map((project, index) => (
              <ProjectListItem
                key={project.id}
                project={project}
                isActive={project.id === currentProjectId}
                isCursor={index === cursorIndex}
                showCursor={focused}
                taskCount={getRootTaskCount(project.id)}
                isEditing={editingId === project.id}
                editingName={editingName}
                copied={copiedId === project.id}
                canDelete={projects.length > 1}
                inputRef={inputRef}
                itemRef={{
                  get current() {
                    return itemRefs.current.get(project.id) ?? null;
                  },
                  set current(value) {
                    if (value) {
                      itemRefs.current.set(project.id, value);
                    } else {
                      itemRefs.current.delete(project.id);
                    }
                  },
                }}
                onSelect={() => {
                  setCurrentProjectId(project.id);
                  setCursorIndex(index);
                }}
                onStartEdit={() => {
                  setEditingId(project.id);
                  setEditingName(project.name);
                }}
                onEditingNameChange={setEditingName}
                onRenameSubmit={handleRenameSubmit}
                onCancelEdit={() => setEditingId(null)}
                onCopy={() => handleCopyProject(project.id)}
                onRequestDelete={() => handleDeleteProject(project.id)}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
