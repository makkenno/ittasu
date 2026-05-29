import { useCallback, useEffect, useState } from "react";
import { tinykeys } from "tinykeys";
import { generateMarkdown, sortByDependencies } from "../../lib/markdown-utils";
import { useToastStore } from "../../stores/toast-store";
import type { TaskEdge } from "../../types/edge";
import type { TaskNode } from "../../types/task";
import { MarkdownPreview } from "../molecules/memo/markdown-preview";
import { PreviewHeader } from "../organisms/preview/preview-header";
import { TableOfContents } from "../organisms/preview/table-of-contents";
import { TaskPreviewSection } from "../organisms/preview/task-preview-section";

interface PreviewPageProps {
  nodes: TaskNode[];
  edges: TaskEdge[];
  currentTaskId: string | null;
  onBack: () => void;
  onTitleChange: (taskId: string, title: string) => void;
  onMemoChange: (taskId: string, memo: string) => void;
}

export function PreviewPage({
  nodes,
  edges,
  currentTaskId,
  onBack,
  onTitleChange,
  onMemoChange,
}: PreviewPageProps) {
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<"preview" | "edit" | "split">("preview");
  const addToast = useToastStore((s) => s.addToast);

  const handleCopy = useCallback(async () => {
    const markdown = generateMarkdown(nodes, edges, currentTaskId);
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      addToast("マークダウンをコピーしました", "success");
    } catch (error) {
      console.error("Failed to copy markdown:", error);
      addToast("コピーに失敗しました", "error");
    }
  }, [nodes, edges, currentTaskId, addToast]);

  useEffect(() => {
    const getContainer = () =>
      document.getElementById("preview-scroll-container");
    const scrollBy = (delta: number) => {
      getContainer()?.scrollBy({ top: delta, behavior: "smooth" });
    };
    const scrollByHalfPage = (sign: 1 | -1) => {
      const el = getContainer();
      if (!el) return;
      el.scrollBy({ top: sign * (el.clientHeight / 2), behavior: "smooth" });
    };
    const scrollTo = (top: number) => {
      getContainer()?.scrollTo({ top, behavior: "smooth" });
    };
    return tinykeys(window, {
      j: (e) => {
        e.preventDefault();
        scrollBy(80);
      },
      k: (e) => {
        e.preventDefault();
        scrollBy(-80);
      },
      "Control+d": (e) => {
        e.preventDefault();
        scrollByHalfPage(1);
      },
      "Control+u": (e) => {
        e.preventDefault();
        scrollByHalfPage(-1);
      },
      "g g": (e) => {
        e.preventDefault();
        scrollTo(0);
      },
      "Shift+g": (e) => {
        e.preventDefault();
        const el = getContainer();
        if (el) scrollTo(el.scrollHeight);
      },
      Escape: (e) => {
        e.preventDefault();
        onBack();
      },
      "Control+[": (e) => {
        e.preventDefault();
        onBack();
      },
      y: (e) => {
        e.preventDefault();
        handleCopy();
      },
    });
  }, [onBack, handleCopy]);

  const renderTasks = () => {
    let tasksToRender: TaskNode[] = [];

    if (currentTaskId) {
      const task = nodes.find((n) => n.id === currentTaskId);
      if (task) {
        tasksToRender = [task];
      }
    } else {
      const rootNodes = nodes.filter((node) => node.parentId === null);
      tasksToRender = sortByDependencies(rootNodes, edges, null);
    }

    const renderTaskRecursive = (task: TaskNode, level: number) => {
      const children = nodes.filter((n) => n.parentId === task.id);
      const sortedChildren = sortByDependencies(children, edges, task.id);

      return (
        <div key={task.id}>
          <TaskPreviewSection
            task={task}
            level={level}
            onTitleChange={onTitleChange}
            onMemoChange={onMemoChange}
          />
          <div className="pl-6 border-l-2 border-gray-100 ml-2">
            {sortedChildren.map((child) =>
              renderTaskRecursive(child, level + 1),
            )}
          </div>
        </div>
      );
    };

    return (
      <div className="max-w-4xl mx-auto p-8 pb-[50dvh]">
        {tasksToRender.map((task) => renderTaskRecursive(task, 1))}
      </div>
    );
  };

  const markdownValue = generateMarkdown(nodes, edges, currentTaskId);

  return (
    <div className="flex flex-col h-[100dvh] bg-white">
      <PreviewHeader
        onBack={onBack}
        mode={mode}
        onModeChange={setMode}
        onCopy={handleCopy}
        copied={copied}
      />

      <div className="flex flex-1 overflow-hidden">
        {mode === "split" ? (
          <>
            <div className="flex-1 min-w-0 overflow-y-auto border-r">
              {renderTasks()}
            </div>
            <div
              id="preview-scroll-container"
              className="flex-1 min-w-0 overflow-y-auto"
            >
              <MarkdownPreview
                value={markdownValue}
                className="h-auto overflow-visible"
              />
            </div>
            <div className="hidden lg:block w-64 border-l border-gray-200 bg-gray-50/50">
              <TableOfContents containerId="preview-scroll-container" />
            </div>
          </>
        ) : (
          <>
            <div
              id="preview-scroll-container"
              className="flex-1 overflow-y-auto"
            >
              {mode === "preview" ? (
                <MarkdownPreview
                  value={markdownValue}
                  className="h-auto overflow-visible"
                />
              ) : (
                renderTasks()
              )}
            </div>

            {mode === "preview" && (
              <div className="hidden lg:block w-64 border-l border-gray-200 bg-gray-50/50">
                <TableOfContents containerId="preview-scroll-container" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
