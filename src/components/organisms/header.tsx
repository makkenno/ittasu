import { BackButton } from "../molecules/header/back-button";
import { CompleteToggle } from "../molecules/header/complete-toggle";
import { CopyMarkdownButton } from "../molecules/header/copy-markdown-button";
import { NextTaskButton } from "../molecules/header/next-task-button";
import { TaskTitle } from "../molecules/header/task-title";

interface HeaderProps {
  title: string;
  completed: boolean;
  hasParent: boolean;
  onTitleChange?: (newTitle: string) => void;
  onToggleComplete?: () => void;
  onBackClick?: () => void;
  onNextTaskClick?: () => void;
  onCopyMarkdown?: () => void;
}

export function Header({
  title,
  completed,
  hasParent,
  onTitleChange,
  onToggleComplete,
  onBackClick,
  onNextTaskClick,
  onCopyMarkdown,
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between gap-2 px-3 py-3 md:px-6 md:py-4 border-b bg-white shadow-sm">
      <div className="flex-shrink-0">
        <BackButton onClick={onBackClick} disabled={!hasParent} />
      </div>

      <div className="flex-1 min-w-0">
        <TaskTitle title={title} onChange={onTitleChange} />
      </div>

      <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
        <CopyMarkdownButton onClick={onCopyMarkdown} />
        <CompleteToggle completed={completed} onToggle={onToggleComplete} />
        <NextTaskButton onClick={onNextTaskClick} />
      </div>
    </header>
  );
}
