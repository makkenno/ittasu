import { useEffect, useRef, useState } from "react";
import { isEscapeKey } from "../../../lib/keyboard";
import { useEditSession } from "../../../stores/use-edit-session";

interface TaskTitleProps {
  title: string;
  onChange?: (newTitle: string) => void;
  editToken?: number;
}

export function TaskTitle({ title, onChange, editToken = 0 }: TaskTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastTokenRef = useRef(editToken);
  const { handleFocus, handleBlur: endSession } = useEditSession();

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (editToken !== lastTokenRef.current) {
      setIsEditing(true);
      setEditValue(title);
    }
    lastTokenRef.current = editToken;
  }, [editToken, title]);

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
    endSession();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter") {
      e.preventDefault();
      handleBlur();
    } else if (isEscapeKey(e)) {
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
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="text-xl font-bold px-2 py-1 border-2 border-blue-500 rounded focus:outline-none w-full"
        aria-label="タスクタイトルを編集"
      />
    );
  }

  return (
    <h1 className="text-xl font-bold flex min-w-0">
      <button
        type="button"
        onClick={handleClick}
        className="px-2 py-1 cursor-pointer hover:bg-gray-100 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 truncate min-w-0"
        aria-label="タスクタイトルを編集"
      >
        {title}
      </button>
    </h1>
  );
}
