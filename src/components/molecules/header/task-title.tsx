import { useEffect, useRef, useState } from "react";

interface TaskTitleProps {
  title: string;
  onChange?: (newTitle: string) => void;
}

export function TaskTitle({ title, onChange }: TaskTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleClick = () => {
    setIsEditing(true);
    setEditValue(title);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue.trim() && editValue !== title) {
      onChange?.(editValue.trim());
    } else {
      setEditValue(title);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleBlur();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditValue(title);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="text-xl font-bold px-2 py-1 border-2 border-blue-500 rounded focus:outline-none"
        aria-label="タスクタイトルを編集"
      />
    );
  }

  return (
    <h1 className="text-xl font-bold">
      <button
        type="button"
        onClick={handleClick}
        className="px-2 py-1 cursor-pointer hover:bg-gray-100 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="タスクタイトルを編集"
      >
        {title}
      </button>
    </h1>
  );
}
