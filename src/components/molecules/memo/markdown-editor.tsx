import { useImperativeHandle, useRef } from "react";
import { isEscapeKey } from "../../../lib/keyboard";
import { useEditSession } from "../../../stores/use-edit-session";

export interface MarkdownEditorHandle {
  focus: () => void;
}

interface MarkdownEditorProps {
  value: string;
  onChange?: (value: string) => void;
  ref?: React.Ref<MarkdownEditorHandle>;
}

export function MarkdownEditor({ value, onChange, ref }: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { handleFocus, handleBlur } = useEditSession();

  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
  }));

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
