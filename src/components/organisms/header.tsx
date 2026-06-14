import { ChevronRight, Menu } from "lucide-react";
import { useImperativeHandle, useRef } from "react";
import { ThemeToggle } from "../molecules/common/theme-toggle";
import { BackButton } from "../molecules/header/back-button";
import { CompleteToggle } from "../molecules/header/complete-toggle";
import { PreviewButton } from "../molecules/header/preview-button";
import {
  TaskTitle,
  type TaskTitleHandle,
} from "../molecules/header/task-title";

export interface HeaderHandle {
  editTitle: () => void;
}

export interface TaskHierarchyItem {
  id: string | null;
  label: string;
}

interface HeaderProps {
  title: string;
  completed: boolean;
  hasParent: boolean;
  hierarchy?: TaskHierarchyItem[];
  onHierarchyNavigate?: (taskId: string | null) => void;
  onTitleChange?: (newTitle: string) => void;
  onToggleComplete?: () => void;
  onBackClick?: () => void;
  onPreviewClick?: () => void;
  showMenuButton?: boolean;
  onMenuClick?: () => void;
  ref?: React.Ref<HeaderHandle>;
}

export function Header({
  title,
  completed,
  hasParent,
  hierarchy = [],
  onHierarchyNavigate,
  onTitleChange,
  onToggleComplete,
  onBackClick,
  onPreviewClick,
  showMenuButton = false,
  onMenuClick,
  ref,
}: HeaderProps) {
  const taskTitleRef = useRef<TaskTitleHandle>(null);

  useImperativeHandle(ref, () => ({
    editTitle: () => taskTitleRef.current?.edit(),
  }));

  return (
    <header className="flex items-center justify-between gap-2 px-3 py-3 md:px-6 md:py-4 border-b bg-white shadow-sm">
      <div className="flex items-center gap-1 flex-shrink-0">
        {showMenuButton && (
          <button
            type="button"
            onClick={onMenuClick}
            className="w-9 h-9 flex items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
            title="メニューを開く"
            aria-label="メニューを開く"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <BackButton onClick={onBackClick} disabled={!hasParent} />
      </div>

      <div className="flex-1 min-w-0">
        {hierarchy.length > 0 && (
          <>
            <nav
              aria-label="タスク階層"
              className="mb-0.5 hidden min-w-0 items-center gap-1 overflow-hidden px-2 text-xs text-gray-500 md:flex"
            >
              {hierarchy.map((item, index) => (
                <div
                  key={item.id ?? "project-root"}
                  className="flex min-w-0 items-center gap-1"
                >
                  {index > 0 && (
                    <ChevronRight
                      className="h-3 w-3 shrink-0 text-gray-300"
                      aria-hidden="true"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => onHierarchyNavigate?.(item.id)}
                    className="max-w-40 truncate rounded px-1 py-0.5 transition-colors hover:bg-gray-100 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    title={item.label}
                  >
                    {item.label}
                  </button>
                </div>
              ))}
            </nav>
            <div className="mb-0.5 flex min-w-0 items-center gap-1 px-2 text-xs text-gray-500 md:hidden">
              <span className="shrink-0 text-gray-400">親:</span>
              <button
                type="button"
                onClick={() =>
                  onHierarchyNavigate?.(
                    hierarchy[hierarchy.length - 1]?.id ?? null,
                  )
                }
                className="min-w-0 truncate rounded px-1 py-0.5 font-medium text-gray-600 transition-colors active:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                title={hierarchy[hierarchy.length - 1]?.label}
              >
                {hierarchy[hierarchy.length - 1]?.label}
              </button>
            </div>
          </>
        )}
        <TaskTitle ref={taskTitleRef} title={title} onChange={onTitleChange} />
      </div>

      <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
        <PreviewButton onClick={onPreviewClick} />
        <CompleteToggle completed={completed} onToggle={onToggleComplete} />
        <ThemeToggle />
      </div>
    </header>
  );
}
