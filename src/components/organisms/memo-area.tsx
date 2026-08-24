import { X } from "lucide-react";
import { useEffect, useImperativeHandle, useRef, useState } from "react";
import { isEscapeKey } from "../../lib/keyboard";
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

const getFocusableElements = (container: HTMLElement) =>
  Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  );

const wrapDialogFocus = (event: React.KeyboardEvent<HTMLDivElement>) => {
  if (event.key !== "Tab") return;

  const focusableElements = getFocusableElements(event.currentTarget);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements.at(-1);
  if (!firstElement || !lastElement) return;

  const shouldWrapBackward =
    event.shiftKey && document.activeElement === firstElement;
  const shouldWrapForward =
    !event.shiftKey && document.activeElement === lastElement;
  if (!shouldWrapBackward && !shouldWrapForward) return;

  event.preventDefault();
  if (shouldWrapBackward) lastElement.focus();
  else firstElement.focus();
};

function FullScreenMemoShell({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!isOpen) {
    return <div className="flex h-full flex-col bg-white">{children}</div>;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="full-screen-memo-editor-title"
      onKeyDown={(event) => {
        if (!event.nativeEvent.isComposing && isEscapeKey(event)) {
          event.preventDefault();
          onClose();
          return;
        }
        wrapDialogFocus(event);
      }}
      className="fixed inset-0 z-[150] flex h-[100dvh] w-screen flex-col bg-white"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {children}
    </div>
  );
}

function FullScreenMemoHeader({ onClose }: { onClose: () => void }) {
  return (
    <header
      className="flex min-h-14 shrink-0 items-center gap-2 border-b border-gray-200 bg-white px-2"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <button
        type="button"
        onClick={onClose}
        className="flex size-11 shrink-0 touch-manipulation cursor-pointer items-center justify-center rounded-full text-gray-700 transition-colors duration-200 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        aria-label="全画面編集を閉じる"
      >
        <X className="size-5" aria-hidden="true" />
      </button>
      <h2
        id="full-screen-memo-editor-title"
        className="min-w-0 flex-1 truncate text-base font-semibold text-gray-900"
      >
        メモを編集
      </h2>
      <button
        type="button"
        onClick={onClose}
        className="min-h-10 shrink-0 touch-manipulation cursor-pointer rounded-full bg-blue-600 px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      >
        完了
      </button>
    </header>
  );
}

const focusModeTab = (mode: TabMode) => {
  setTimeout(() => document.getElementById(`memo-${mode}-tab`)?.focus(), 0);
};

function MemoModeControls({
  mode,
  isMobile,
  onModeChange,
  onCopyMemo,
  onCopyExportPrompt,
}: {
  mode: TabMode;
  isMobile: boolean;
  onModeChange: (mode: TabMode) => void;
  onCopyMemo?: () => void;
  onCopyExportPrompt?: () => void;
}) {
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

    onModeChange(nextMode);
    focusModeTab(nextMode);
  };

  const tabClassName = (tabMode: TabMode, desktopOnly = false) =>
    cn(
      desktopOnly ? "hidden md:block" : "",
      "min-h-11 flex-1 rounded-md px-3 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 md:min-h-9",
      mode === tabMode
        ? "bg-white text-blue-700 shadow-sm"
        : "text-gray-600 hover:bg-white/60 hover:text-gray-900",
    );

  const renderTab = (tabMode: TabMode, label: string, desktopOnly = false) => (
    <button
      id={`memo-${tabMode}-tab`}
      key={tabMode}
      type="button"
      role="tab"
      aria-selected={mode === tabMode}
      aria-controls="memo-content-panel"
      tabIndex={mode === tabMode ? 0 : -1}
      onClick={() => onModeChange(tabMode)}
      onKeyDown={(event) => handleModeKeyDown(event, tabMode)}
      className={tabClassName(tabMode, desktopOnly)}
    >
      {label}
    </button>
  );

  return (
    <div className="flex items-center gap-2 border-b bg-gray-50 px-3 py-2">
      <div
        className="flex min-w-0 flex-1 rounded-lg bg-gray-200/70 p-1 md:max-w-sm"
        role="tablist"
        aria-label="メモの表示モード"
      >
        {renderTab("edit", "編集")}
        {renderTab("split", "分割", true)}
        {renderTab("preview", "プレビュー")}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <CopyExportPromptButton onClick={onCopyExportPrompt} />
        <CopyMemoButton onClick={onCopyMemo} />
      </div>
    </div>
  );
}

function MemoContent({
  mode,
  memo,
  isMobile,
  editorRef,
  onMemoChange,
  onOpenFullScreen,
}: {
  mode: TabMode;
  memo: string;
  isMobile: boolean;
  editorRef: React.RefObject<MarkdownEditorHandle | null>;
  onMemoChange?: (newMemo: string) => void;
  onOpenFullScreen: () => void;
}) {
  if (mode === "preview") return <MarkdownPreview value={memo} />;

  if (mode === "split") {
    return (
      <div className="flex h-full">
        <div className="min-w-0 flex-1 border-r">
          <MarkdownEditor
            ref={editorRef}
            value={memo}
            onChange={onMemoChange}
          />
        </div>
        <div className="min-w-0 flex-1 overflow-y-auto">
          <MarkdownPreview value={memo} />
        </div>
      </div>
    );
  }

  return (
    <MarkdownEditor
      ref={editorRef}
      value={memo}
      onChange={onMemoChange}
      onFocus={() => {
        if (isMobile) onOpenFullScreen();
      }}
    />
  );
}

function MemoContentPanel({
  isFullScreen,
  mode,
  children,
}: {
  isFullScreen: boolean;
  mode: TabMode;
  children: React.ReactNode;
}) {
  if (isFullScreen) {
    return (
      <div id="memo-content-panel" className="flex-1 overflow-hidden">
        {children}
      </div>
    );
  }

  return (
    <div
      id="memo-content-panel"
      role="tabpanel"
      aria-labelledby={`memo-${mode}-tab`}
      className="flex-1 overflow-hidden"
    >
      {children}
    </div>
  );
}

export function MemoArea({
  memo,
  onMemoChange,
  onCopyMemo,
  onCopyExportPrompt,
  ref,
}: MemoAreaProps) {
  const [mode, setMode] = useState<TabMode>("edit");
  const [isFullScreenEditorOpen, setIsFullScreenEditorOpen] = useState(false);
  const isMobile = useIsMobile();
  const editorRef = useRef<MarkdownEditorHandle>(null);

  useEffect(() => {
    if (!isFullScreenEditorOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isFullScreenEditorOpen]);

  useEffect(() => {
    if (!isMobile) setIsFullScreenEditorOpen(false);
  }, [isMobile]);

  useImperativeHandle(ref, () => ({
    focusEditor: () => {
      setMode("edit");
      requestAnimationFrame(() => editorRef.current?.focus());
    },
  }));

  const effectiveMode = isMobile && mode === "split" ? "edit" : mode;
  const closeFullScreenEditor = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setIsFullScreenEditorOpen(false);
    requestAnimationFrame(() =>
      document.getElementById("memo-edit-tab")?.focus(),
    );
  };

  return (
    <FullScreenMemoShell
      isOpen={isFullScreenEditorOpen}
      onClose={closeFullScreenEditor}
    >
      {isFullScreenEditorOpen ? (
        <FullScreenMemoHeader onClose={closeFullScreenEditor} />
      ) : (
        <MemoModeControls
          mode={effectiveMode}
          isMobile={isMobile}
          onModeChange={setMode}
          onCopyMemo={onCopyMemo}
          onCopyExportPrompt={onCopyExportPrompt}
        />
      )}
      <MemoContentPanel
        isFullScreen={isFullScreenEditorOpen}
        mode={effectiveMode}
      >
        <MemoContent
          mode={effectiveMode}
          memo={memo}
          isMobile={isMobile}
          editorRef={editorRef}
          onMemoChange={onMemoChange}
          onOpenFullScreen={() => setIsFullScreenEditorOpen(true)}
        />
      </MemoContentPanel>
    </FullScreenMemoShell>
  );
}
