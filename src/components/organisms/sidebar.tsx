import { ChevronLeft, ChevronRight, Folder, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTaskStore } from "../../stores/task-store";
import { ConfirmDialog } from "../molecules/common/confirm-dialog";

export function Sidebar() {
  const projects = useTaskStore((s) => s.projects);
  const currentProjectId = useTaskStore((s) => s.currentProjectId);
  const nodes = useTaskStore((s) => s.nodes);
  const addProject = useTaskStore((s) => s.addProject);
  const renameProject = useTaskStore((s) => s.renameProject);
  const deleteProject = useTaskStore((s) => s.deleteProject);
  const setCurrentProjectId = useTaskStore((s) => s.setCurrentProjectId);

  const [collapsed, setCollapsed] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editingId]);

  const handleAddProject = () => {
    if (collapsed) setCollapsed(false);
    const newId = `project-${Date.now()}`;
    addProject(newId, "新しいプロジェクト");
    setEditingId(newId);
    setEditingName("新しいプロジェクト");
  };

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

  const handleDeleteConfirm = () => {
    if (deleteTargetId) {
      deleteProject(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  const getRootTaskCount = (projectId: string) =>
    nodes.filter((n) => n.parentId === null && n.projectId === projectId)
      .length;

  const deleteTarget = projects.find((p) => p.id === deleteTargetId);
  const deleteTaskCount = deleteTargetId ? getRootTaskCount(deleteTargetId) : 0;

  return (
    <>
      <div
        className={`h-full bg-gray-50 border-r border-gray-200 flex flex-col flex-shrink-0 transition-all duration-200 ${
          collapsed ? "w-10" : "w-52"
        }`}
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
            onClick={() => setCollapsed((c) => !c)}
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
                onClick={handleAddProject}
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
                    onClick={() => setCurrentProjectId(project.id)}
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
                  onClick={handleAddProject}
                  className="text-gray-400 hover:text-gray-600 w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 transition-colors"
                  title="プロジェクトを追加"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              {projects.map((project) => {
                const isActive = project.id === currentProjectId;
                const taskCount = getRootTaskCount(project.id);
                return (
                  <button
                    key={project.id}
                    type="button"
                    className={`group w-full text-left flex items-center gap-1.5 mx-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
                      isActive
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                    onClick={() => setCurrentProjectId(project.id)}
                    onDoubleClick={(e) => {
                      e.preventDefault();
                      setEditingId(project.id);
                      setEditingName(project.name);
                    }}
                  >
                    <Folder
                      className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? "text-blue-500" : "text-gray-400"}`}
                    />
                    {editingId === project.id ? (
                      <input
                        ref={inputRef}
                        className="flex-1 text-sm bg-white border border-blue-300 rounded px-1 py-0 outline-none min-w-0"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={handleRenameSubmit}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleRenameSubmit();
                          }
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onFocus={(e) => e.target.select()}
                      />
                    ) : (
                      <>
                        <span className="flex-1 text-sm truncate">
                          {project.name}
                        </span>
                        {taskCount > 0 && (
                          <span
                            className={`text-xs flex-shrink-0 ${isActive ? "text-blue-400" : "text-gray-400"}`}
                          >
                            {taskCount}
                          </span>
                        )}
                        {projects.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTargetId(project.id);
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
              })}
            </>
          )}
        </div>
      </div>
      <ConfirmDialog
        isOpen={deleteTargetId !== null}
        title="プロジェクトを削除"
        message={
          deleteTaskCount > 0
            ? `「${deleteTarget?.name}」を削除します。このプロジェクトのタスク ${deleteTaskCount} 件も削除されます。`
            : `「${deleteTarget?.name}」を削除しますか？`
        }
        confirmLabel="削除"
        isDestructive
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTargetId(null)}
      />
    </>
  );
}
