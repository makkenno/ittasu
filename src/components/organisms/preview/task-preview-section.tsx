import { useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { cn } from "../../../lib/utils";
import type { TaskNode } from "../../../types/task";
import { MarkdownPreview } from "../../molecules/memo/markdown-preview";

interface TaskPreviewSectionProps {
  task: TaskNode;
  level: number;
  onTitleChange: (taskId: string, title: string) => void;
  onMemoChange: (taskId: string, memo: string) => void;
}

export function TaskPreviewSection({
  task,
  level,
  onTitleChange,
  onMemoChange,
}: TaskPreviewSectionProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingMemo, setIsEditingMemo] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [memo, setMemo] = useState(task.memo);

  const startEditingTitle = () => {
    setTitle(task.title);
    setIsEditingTitle(true);
  };

  const startEditingMemo = () => {
    setMemo(task.memo);
    setIsEditingMemo(true);
  };

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (title !== task.title) {
      onTitleChange(task.id, title);
    }
  };

  const handleMemoSubmit = () => {
    setIsEditingMemo(false);
    if (memo !== task.memo) {
      onMemoChange(task.id, memo);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    submit: () => void,
  ) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      submit();
    }
  };

  const HeadingTag = `h${Math.min(level, 6)}` as React.ElementType;
  const fontSize =
    level === 1
      ? "text-2xl"
      : level === 2
        ? "text-xl"
        : level === 3
          ? "text-lg"
          : "text-base";

  return (
    <div className="mb-8">
      <div className="group relative mb-4">
        {isEditingTitle ? (
          <input
            // biome-ignore lint/a11y/noAutofocus: Editing starts from an explicit user action.
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleTitleSubmit();
            }}
            className={cn(
              "w-full font-bold bg-transparent border-b-2 border-blue-500 focus:outline-none",
              fontSize,
            )}
          />
        ) : (
          <HeadingTag
            onClick={startEditingTitle}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                startEditingTitle();
              }
            }}
            tabIndex={0}
            role="button"
            className={cn(
              "font-bold transition-colors cursor-text hover:bg-gray-50 rounded px-1 -mx-1 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500",
              fontSize,
              !task.title && "text-gray-400 italic",
            )}
          >
            {task.title || "無題"}
          </HeadingTag>
        )}
      </div>

      <div className="group relative min-h-[2rem]">
        {isEditingMemo ? (
          <TextareaAutosize
            autoFocus
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            onBlur={handleMemoSubmit}
            onKeyDown={(e) => handleKeyDown(e, handleMemoSubmit)}
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] resize-none"
            placeholder="メモを入力..."
            minRows={3}
          />
        ) : (
          // biome-ignore lint/a11y/useSemanticElements: MarkdownPreview contains interactive elements (links), so we cannot use a button.
          <div
            onClick={startEditingMemo}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                startEditingMemo();
              }
            }}
            tabIndex={0}
            role="button"
            className="transition-colors cursor-text hover:bg-gray-50 rounded p-2 -m-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {task.memo ? (
              <MarkdownPreview value={task.memo} />
            ) : (
              <p className="text-gray-400 italic">メモなし</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
