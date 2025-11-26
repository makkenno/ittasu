import { useState } from "react";
import { generateMarkdown, sortByDependencies } from "../../lib/markdown-utils";
import type { TaskEdge } from "../../types/edge";
import type { TaskNode } from "../../types/task";
import { MarkdownPreview } from "../molecules/memo/markdown-preview";
import { PreviewHeader } from "../organisms/preview/preview-header";
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
  const [mode, setMode] = useState<"preview" | "edit">("preview");

  const handleCopy = async () => {
    const markdown = generateMarkdown(nodes, edges, currentTaskId);
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy markdown:", error);
    }
  };

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

  return (
    <div className="flex flex-col h-[100dvh] bg-white">
      <PreviewHeader
        onBack={onBack}
        mode={mode}
        onModeChange={setMode}
        onCopy={handleCopy}
        copied={copied}
      />

      <div className="flex-1 overflow-y-auto">
        {mode === "preview" ? (
          <MarkdownPreview
            value={generateMarkdown(nodes, edges, currentTaskId)}
          />
        ) : (
          renderTasks()
        )}
      </div>
    </div>
  );
}
