import { useEffect, useRef, useState } from "react";
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
  const titleInputRef = useRef<HTMLInputElement>(null);
  const memoTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTitle(task.title);
  }, [task.title]);

  useEffect(() => {
    setMemo(task.memo);
  }, [task.memo]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    if (isEditingMemo && memoTextareaRef.current) {
      memoTextareaRef.current.focus();
    }
  }, [isEditingMemo]);

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
            ref={titleInputRef}
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
            onClick={() => setIsEditingTitle(true)}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsEditingTitle(true);
              }
            }}
            tabIndex={0}
            role="button"
            className={cn(
              "font-bold transition-colors cursor-text hover:bg-gray-50 rounded px-1 -mx-1 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500",
              fontSize,
              !title && "text-gray-400 italic",
            )}
          >
            {title || "無題"}
          </HeadingTag>
        )}
      </div>

      <div className="group relative min-h-[2rem]">
        {isEditingMemo ? (
          <TextareaAutosize
            ref={memoTextareaRef}
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
            onClick={() => setIsEditingMemo(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsEditingMemo(true);
              }
            }}
            tabIndex={0}
            role="button"
            className="transition-colors cursor-text hover:bg-gray-50 rounded p-2 -m-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {memo ? (
              <MarkdownPreview value={memo} />
            ) : (
              <p className="text-gray-400 italic">メモなし</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
