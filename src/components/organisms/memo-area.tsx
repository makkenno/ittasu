import { useImperativeHandle, useRef, useState } from "react";
import { useIsMobile } from "../../lib/use-is-mobile";
import { cn } from "../../lib/utils";
import { CopyExportPromptButton } from "../molecules/memo/copy-export-prompt-button";
import { CopyMemoButton } from "../molecules/memo/copy-memo-button";
import {
  MarkdownEditor,
  type MarkdownEditorHandle,
} from "../molecules/memo/markdown-editor";
import { MarkdownPreview } from "../molecules/memo/markdown-preview";

export interface MemoAreaHandle {
  focusEditor: () => void;
}

interface MemoAreaProps {
  memo: string;
  onMemoChange?: (newMemo: string) => void;
  onCopyMemo?: () => void;
  onCopyExportPrompt?: () => void;
  ref?: React.Ref<MemoAreaHandle>;
}

type TabMode = "edit" | "preview" | "split";

export function MemoArea({
  memo,
  onMemoChange,
  onCopyMemo,
  onCopyExportPrompt,
  ref,
}: MemoAreaProps) {
  const [mode, setMode] = useState<TabMode>("edit");
  const isMobile = useIsMobile();
  const editorRef = useRef<MarkdownEditorHandle>(null);

  useImperativeHandle(ref, () => ({
    focusEditor: () => {
      setMode("edit");
      requestAnimationFrame(() => editorRef.current?.focus());
    },
  }));

  // モバイルでは分割モードを使わないため、編集扱いにする
  const effectiveMode = isMobile && mode === "split" ? "edit" : mode;

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between border-b">
        <div className="flex">
          <button
            type="button"
            onClick={() => setMode("edit")}
            className={cn(
              "px-4 py-2 font-medium transition-colors",
              effectiveMode === "edit"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600 hover:text-gray-800",
            )}
          >
            編集
          </button>
          {/* 分割モードはモバイルでは表示しない（画面幅が狭く実用的でないため） */}
          <button
            type="button"
            onClick={() => setMode("split")}
            className={cn(
              "hidden md:block px-4 py-2 font-medium transition-colors",
              effectiveMode === "split"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600 hover:text-gray-800",
            )}
          >
            分割
          </button>
          <button
            type="button"
            onClick={() => setMode("preview")}
            className={cn(
              "px-4 py-2 font-medium transition-colors",
              effectiveMode === "preview"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600 hover:text-gray-800",
            )}
          >
            プレビュー
          </button>
        </div>
        <div className="flex items-center px-2 gap-1">
          <CopyExportPromptButton onClick={onCopyExportPrompt} />
          <CopyMemoButton onClick={onCopyMemo} />
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {effectiveMode === "edit" && (
          <MarkdownEditor
            ref={editorRef}
            value={memo}
            onChange={onMemoChange}
          />
        )}
        {effectiveMode === "preview" && <MarkdownPreview value={memo} />}
        {effectiveMode === "split" && (
          <div className="flex h-full">
            <div className="flex-1 min-w-0 border-r">
              <MarkdownEditor
                ref={editorRef}
                value={memo}
                onChange={onMemoChange}
              />
            </div>
            <div className="flex-1 min-w-0 overflow-y-auto">
              <MarkdownPreview value={memo} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
