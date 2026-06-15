import { useImperativeHandle, useState } from "react";
import { isEscapeKey } from "../../../lib/keyboard";
import { useEditSession } from "../../../stores/use-edit-session";

export interface TaskTitleHandle {
  edit: () => void;
}

interface TaskTitleProps {
  title: string;
  onChange?: (newTitle: string) => void;
  ref?: React.Ref<TaskTitleHandle>;
}

export function TaskTitle({ title, onChange, ref }: TaskTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const { handleFocus, handleBlur: endSession } = useEditSession();

  const startEditing = () => {
    setIsEditing(true);
    setEditValue(title);
  };

  useImperativeHandle(ref, () => ({ edit: startEditing }));

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
        // biome-ignore lint/a11y/noAutofocus: Editing starts from an explicit user action.
        autoFocus
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onFocus={(event) => {
          handleFocus();
          event.currentTarget.select();
        }}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-full rounded border-2 border-blue-500 px-2 py-1 text-base font-bold leading-5 focus:outline-none md:text-xl md:leading-normal"
        aria-label="タスクタイトルを編集"
      />
    );
  }

  return (
    <h1 className="flex min-w-0 text-base font-bold leading-5 md:text-xl md:leading-normal">
      <button
        type="button"
        onClick={startEditing}
        className="line-clamp-2 min-w-0 cursor-pointer rounded px-2 py-1 text-left transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 md:line-clamp-1"
        aria-label="タスクタイトルを編集"
        title={title}
      >
        {title}
      </button>
    </h1>
  );
}
