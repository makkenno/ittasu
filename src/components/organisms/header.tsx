import { Menu } from "lucide-react";
import { useImperativeHandle, useRef } from "react";
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

interface HeaderProps {
  title: string;
  completed: boolean;
  hasParent: boolean;
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
        <TaskTitle ref={taskTitleRef} title={title} onChange={onTitleChange} />
      </div>

      <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
        <PreviewButton onClick={onPreviewClick} />
        <CompleteToggle completed={completed} onToggle={onToggleComplete} />
      </div>
    </header>
  );
}
