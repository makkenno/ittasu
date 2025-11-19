import { useState } from "react";
import { cn } from "../../lib/utils";
import { CopyMemoButton } from "../molecules/memo/copy-memo-button";
import { MarkdownEditor } from "../molecules/memo/markdown-editor";
import { MarkdownPreview } from "../molecules/memo/markdown-preview";

interface MemoAreaProps {
  memo: string;
  onMemoChange?: (newMemo: string) => void;
  onCopyMemo?: () => void;
}

type TabMode = "edit" | "preview";

export function MemoArea({ memo, onMemoChange, onCopyMemo }: MemoAreaProps) {
  const [mode, setMode] = useState<TabMode>("edit");

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between border-b">
        <div className="flex">
          <button
            type="button"
            onClick={() => setMode("edit")}
            className={cn(
              "px-4 py-2 font-medium transition-colors",
              mode === "edit"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600 hover:text-gray-800",
            )}
          >
            編集
          </button>
          <button
            type="button"
            onClick={() => setMode("preview")}
            className={cn(
              "px-4 py-2 font-medium transition-colors",
              mode === "preview"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600 hover:text-gray-800",
            )}
          >
            プレビュー
          </button>
        </div>
        <div className="px-2">
          <CopyMemoButton onClick={onCopyMemo} />
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {mode === "edit" ? (
          <MarkdownEditor value={memo} onChange={onMemoChange} />
        ) : (
          <MarkdownPreview value={memo} />
        )}
      </div>
    </div>
  );
}
