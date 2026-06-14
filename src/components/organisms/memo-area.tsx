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
  const handleModeKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    currentMode: TabMode,
  ) => {
    const modes: TabMode[] = isMobile
      ? ["edit", "preview"]
      : ["edit", "split", "preview"];
    const currentIndex = modes.indexOf(currentMode);
    let nextIndex: number;

    switch (event.key) {
      case "ArrowLeft":
        nextIndex = (currentIndex - 1 + modes.length) % modes.length;
        break;
      case "ArrowRight":
        nextIndex = (currentIndex + 1) % modes.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = modes.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    const nextMode = modes[nextIndex];
    if (!nextMode) return;

    setMode(nextMode);
    setTimeout(
      () => document.getElementById(`memo-${nextMode}-tab`)?.focus(),
      0,
    );
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center gap-2 border-b bg-gray-50 px-3 py-2">
        <div
          className="flex min-w-0 flex-1 rounded-lg bg-gray-200/70 p-1 md:max-w-sm"
          role="tablist"
          aria-label="メモの表示モード"
        >
          <button
            id="memo-edit-tab"
            type="button"
            role="tab"
            aria-selected={effectiveMode === "edit"}
            aria-controls="memo-content-panel"
            tabIndex={effectiveMode === "edit" ? 0 : -1}
            onClick={() => setMode("edit")}
            onKeyDown={(event) => handleModeKeyDown(event, "edit")}
            className={cn(
              "min-h-11 flex-1 rounded-md px-3 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 md:min-h-9",
              effectiveMode === "edit"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-gray-600 hover:bg-white/60 hover:text-gray-900",
            )}
          >
            編集
          </button>
          {/* 分割モードはモバイルでは表示しない（画面幅が狭く実用的でないため） */}
          <button
            id="memo-split-tab"
            type="button"
            role="tab"
            aria-selected={effectiveMode === "split"}
            aria-controls="memo-content-panel"
            tabIndex={effectiveMode === "split" ? 0 : -1}
            onClick={() => setMode("split")}
            onKeyDown={(event) => handleModeKeyDown(event, "split")}
            className={cn(
              "hidden min-h-9 flex-1 rounded-md px-3 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 md:block",
              effectiveMode === "split"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-gray-600 hover:bg-white/60 hover:text-gray-900",
            )}
          >
            分割
          </button>
          <button
            id="memo-preview-tab"
            type="button"
            role="tab"
            aria-selected={effectiveMode === "preview"}
            aria-controls="memo-content-panel"
            tabIndex={effectiveMode === "preview" ? 0 : -1}
            onClick={() => setMode("preview")}
            onKeyDown={(event) => handleModeKeyDown(event, "preview")}
            className={cn(
              "min-h-11 flex-1 rounded-md px-3 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 md:min-h-9",
              effectiveMode === "preview"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-gray-600 hover:bg-white/60 hover:text-gray-900",
            )}
          >
            プレビュー
          </button>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <CopyExportPromptButton onClick={onCopyExportPrompt} />
          <CopyMemoButton onClick={onCopyMemo} />
        </div>
      </div>

      <div
        id="memo-content-panel"
        role="tabpanel"
        aria-labelledby={`memo-${effectiveMode}-tab`}
        className="flex-1 overflow-hidden"
      >
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
