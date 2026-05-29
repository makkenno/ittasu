import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { isEscapeKey } from "../../../lib/keyboard";
import type { TaskNode } from "../../../types/task";

interface TaskSearchDialogProps {
  isOpen: boolean;
  nodes: TaskNode[];
  onClose: () => void;
  onSelect: (taskId: string) => void;
}

export function TaskSearchDialog({
  isOpen,
  nodes,
  onClose,
  onSelect,
}: TaskSearchDialogProps) {
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setCursor(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  const matches = useMemo(() => {
    if (!query.trim()) return nodes;
    const q = query.toLowerCase();
    return nodes.filter((n) => n.title.toLowerCase().includes(q));
  }, [query, nodes]);

  useEffect(() => {
    setCursor((c) => Math.min(c, Math.max(matches.length - 1, 0)));
  }, [matches.length]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLLIElement>(
      `[data-index="${cursor}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  if (!isOpen) return null;

  const submit = () => {
    const match = matches[cursor];
    if (match) {
      onSelect(match.id);
      onClose();
    }
  };

  const isMoveDown = (e: React.KeyboardEvent) =>
    e.key === "ArrowDown" || (e.ctrlKey && (e.key === "n" || e.key === "j"));
  const isMoveUp = (e: React.KeyboardEvent) =>
    e.key === "ArrowUp" || (e.ctrlKey && (e.key === "p" || e.key === "k"));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (isEscapeKey(e)) {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
      return;
    }
    if (isMoveDown(e)) {
      e.preventDefault();
      setCursor((c) => Math.min(matches.length - 1, c + 1));
      return;
    }
    if (isMoveUp(e)) {
      e.preventDefault();
      setCursor((c) => Math.max(0, c - 1));
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-start justify-center pt-24 p-4">
      <button
        type="button"
        aria-label="検索を閉じる"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <div
        className="relative w-full max-w-lg bg-white rounded-xl shadow-xl overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="タスクを検索"
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="タスク名を検索..."
            className="flex-1 outline-none text-sm"
          />
          <span className="text-xs text-gray-400">{matches.length} 件</span>
        </div>
        <ul ref={listRef} className="max-h-80 overflow-y-auto py-1">
          {matches.length === 0 ? (
            <li className="px-4 py-6 text-sm text-gray-400 text-center">
              一致するタスクがありません
            </li>
          ) : (
            matches.map((task, index) => (
              <li
                key={task.id}
                data-index={index}
                className={`px-4 py-2 text-sm cursor-pointer flex items-center gap-2 ${
                  index === cursor
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:bg-gray-50"
                } ${task.completed ? "line-through text-gray-400" : ""}`}
              >
                <button
                  type="button"
                  onClick={() => {
                    onSelect(task.id);
                    onClose();
                  }}
                  className="flex-1 text-left truncate"
                >
                  {task.title || "（無題）"}
                </button>
              </li>
            ))
          )}
        </ul>
        <div className="px-4 py-2 text-xs text-gray-400 border-t border-gray-200 flex gap-4">
          <span>↑↓ / Ctrl+J/K 移動</span>
          <span>Enter で選択</span>
          <span>Esc キャンセル</span>
        </div>
      </div>
    </div>
  );
}
