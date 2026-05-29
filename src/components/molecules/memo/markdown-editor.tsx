import { useEffect, useRef } from "react";
import { isEscapeKey } from "../../../lib/keyboard";
import { useEditSession } from "../../../stores/use-edit-session";

interface MarkdownEditorProps {
  value: string;
  onChange?: (value: string) => void;
  focusToken?: number;
}

export function MarkdownEditor({
  value,
  onChange,
  focusToken = 0,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastTokenRef = useRef(focusToken);
  const { handleFocus, handleBlur } = useEditSession();

  useEffect(() => {
    if (focusToken !== lastTokenRef.current && textareaRef.current) {
      textareaRef.current.focus();
    }
    lastTokenRef.current = focusToken;
  }, [focusToken]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={(e) => {
        if (e.nativeEvent.isComposing) return;
        if (isEscapeKey(e)) {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
      className="w-full h-full p-4 font-mono text-base sm:text-sm border-0 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
      placeholder="Markdown形式でメモを入力..."
    />
  );
}
