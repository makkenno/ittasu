import {
  Bold,
  Code2,
  Heading2,
  IndentDecrease,
  IndentIncrease,
  Italic,
  Keyboard,
  Link,
  List,
  ListOrdered,
  Quote,
} from "lucide-react";
import {
  useCallback,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import TextareaAutosize from "react-textarea-autosize";
import { isEscapeKey } from "../../../lib/keyboard";
import {
  applyMarkdownFormat,
  continueMarkdownList,
  type MarkdownFormat,
} from "../../../lib/markdown-editor-utils";
import { cn } from "../../../lib/utils";
import { useEditSession } from "../../../stores/use-edit-session";

export interface MarkdownEditorHandle {
  focus: () => void;
}

interface MarkdownEditorProps {
  value: string;
  onChange?: (value: string) => void;
  ref?: React.Ref<MarkdownEditorHandle>;
  autoFocus?: boolean;
  autoSize?: boolean;
  minRows?: number;
  id?: string;
  ariaLabel?: string;
  placeholder?: string;
  className?: string;
  onFocus?: React.FocusEventHandler<HTMLTextAreaElement>;
  onBlur?: React.FocusEventHandler<HTMLTextAreaElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLTextAreaElement>;
}

const toolbarItems: {
  format: MarkdownFormat;
  label: string;
  shortcut?: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { format: "heading", label: "見出し", icon: Heading2 },
  { format: "bulletList", label: "箇条書き", icon: List },
  { format: "orderedList", label: "番号付きリスト", icon: ListOrdered },
  { format: "indent", label: "ネストを深くする", icon: IndentIncrease },
  { format: "outdent", label: "ネストを浅くする", icon: IndentDecrease },
  { format: "bold", label: "太字", shortcut: "Ctrl/⌘ B", icon: Bold },
  { format: "italic", label: "斜体", shortcut: "Ctrl/⌘ I", icon: Italic },
  { format: "link", label: "リンク", shortcut: "Ctrl/⌘ K", icon: Link },
  { format: "code", label: "インラインコード", icon: Code2 },
  { format: "quote", label: "引用", icon: Quote },
];

const getKeyboardFormat = (
  event: React.KeyboardEvent<HTMLTextAreaElement>,
): MarkdownFormat | undefined => {
  if (!event.metaKey && !event.ctrlKey) return undefined;

  const formatByKey: Record<string, MarkdownFormat | undefined> = {
    b: "bold",
    i: "italic",
    k: "link",
  };
  return formatByKey[event.key.toLowerCase()];
};

export function MarkdownEditor({
  value,
  onChange,
  ref,
  autoFocus = false,
  autoSize = false,
  minRows = 3,
  id,
  ariaLabel = "Markdownエディタ",
  placeholder = "Markdown形式でメモを入力...",
  className,
  onFocus,
  onBlur,
  onKeyDown,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const keyboardHelpId = useId();
  const [tabMovesFocus, setTabMovesFocus] = useState(false);
  const [tabEscapeReady, setTabEscapeReady] = useState(false);
  const { handleFocus, handleBlur } = useEditSession();

  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
  }));

  const commitEdit = useCallback(
    (edit: { value: string; selectionStart: number; selectionEnd: number }) => {
      const textarea = textareaRef.current;
      if (!textarea || !onChange) return;

      onChange(edit.value);
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(edit.selectionStart, edit.selectionEnd);
      });
    },
    [onChange],
  );

  const applyFormat = useCallback(
    (format: MarkdownFormat) => {
      const textarea = textareaRef.current;
      if (!textarea || !onChange) return;

      const edit = applyMarkdownFormat(
        value,
        textarea.selectionStart,
        textarea.selectionEnd,
        format,
      );
      commitEdit(edit);
    },
    [commitEdit, onChange, value],
  );

  const handleTabNavigationKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ): boolean => {
    if (event.key === "Tab") {
      if (tabMovesFocus || tabEscapeReady || !onChange) {
        setTabEscapeReady(false);
        onKeyDown?.(event);
        return true;
      }

      event.preventDefault();
      applyFormat(event.shiftKey ? "outdent" : "indent");
      return true;
    }

    if (isEscapeKey(event)) {
      event.preventDefault();
      setTabEscapeReady(true);
      return true;
    }

    if (
      tabEscapeReady &&
      !["Alt", "Control", "Meta", "Shift"].includes(event.key)
    ) {
      setTabEscapeReady(false);
    }

    return false;
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.nativeEvent.isComposing) return;
    if (handleTabNavigationKeyDown(event)) return;

    const keyboardFormat = getKeyboardFormat(event);
    if (keyboardFormat) {
      event.preventDefault();
      applyFormat(keyboardFormat);
      return;
    }

    if (
      event.key === "Enter" &&
      !event.altKey &&
      !event.shiftKey &&
      !event.metaKey &&
      !event.ctrlKey
    ) {
      const edit = continueMarkdownList(
        value,
        event.currentTarget.selectionStart,
        event.currentTarget.selectionEnd,
      );
      if (edit) {
        event.preventDefault();
        commitEdit(edit);
        return;
      }
    }

    onKeyDown?.(event);
  };

  const keyboardHelp = tabEscapeReady
    ? "次のTabまたはShift+Tabでエディタからフォーカスを移動します"
    : tabMovesFocus
      ? "Tab / Shift+Tab: フォーカス移動"
      : "Tab: インデント · Shift+Tab: インデント解除 · Esc→Tab: フォーカス移動";

  const sharedTextareaProps = {
    id,
    ref: textareaRef,
    value,
    placeholder,
    "aria-label": ariaLabel,
    "aria-describedby": keyboardHelpId,
    onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) =>
      onChange?.(event.target.value),
    onFocus: (event: React.FocusEvent<HTMLTextAreaElement>) => {
      handleFocus();
      onFocus?.(event);
    },
    onBlur: (event: React.FocusEvent<HTMLTextAreaElement>) => {
      setTabEscapeReady(false);
      onBlur?.(event);
      handleBlur();
    },
    onKeyDown: handleKeyDown,
    autoCapitalize: "sentences" as const,
    spellCheck: true,
  };

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col overflow-hidden bg-white",
        autoSize ? "rounded-md border border-gray-300" : "h-full",
        className,
      )}
    >
      <div
        role="toolbar"
        aria-label="Markdown書式"
        className="flex min-h-12 shrink-0 touch-pan-x items-center gap-2 overflow-x-auto overscroll-x-contain border-b border-gray-200 bg-gray-50 px-2 py-1 [scrollbar-width:none] sm:min-h-10 sm:gap-0.5 sm:px-1.5 [&::-webkit-scrollbar]:hidden"
      >
        <span className="mr-1 hidden shrink-0 px-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500 sm:inline">
          Markdown
        </span>
        {toolbarItems.map(({ format, label, shortcut, icon: Icon }) => (
          <button
            key={format}
            type="button"
            aria-label={label}
            title={shortcut ? `${label} (${shortcut})` : label}
            disabled={!onChange}
            onPointerDown={(event) => event.preventDefault()}
            onClick={() => applyFormat(format)}
            className="flex size-11 shrink-0 touch-manipulation cursor-pointer select-none items-center justify-center rounded-md text-gray-600 transition-colors duration-200 hover:bg-gray-200 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40 sm:size-8 sm:rounded"
          >
            <Icon className="size-[18px] sm:size-4" />
          </button>
        ))}
        <span
          aria-hidden="true"
          className="mx-1 h-6 w-px shrink-0 bg-gray-300"
        />
        <button
          type="button"
          aria-label="Tabキーでフォーカス移動"
          aria-pressed={tabMovesFocus}
          title={
            tabMovesFocus
              ? "Tabキーの動作をインデントに戻す"
              : "Tabキーの動作をフォーカス移動に切り替える"
          }
          onPointerDown={(event) => event.preventDefault()}
          onClick={() => {
            setTabMovesFocus((current) => !current);
            setTabEscapeReady(false);
          }}
          className={cn(
            "flex h-11 shrink-0 touch-manipulation cursor-pointer select-none items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors duration-200 hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:h-8 sm:rounded",
            tabMovesFocus
              ? "bg-blue-100 text-blue-700"
              : "text-gray-600 hover:text-gray-900",
          )}
        >
          <Keyboard className="size-[18px] sm:size-4" aria-hidden="true" />
          <span className="whitespace-nowrap">
            {tabMovesFocus ? "Tabで移動" : "Tabで字下げ"}
          </span>
        </button>
      </div>

      {autoSize ? (
        <TextareaAutosize
          {...sharedTextareaProps}
          autoFocus={autoFocus}
          minRows={minRows}
          className="w-full resize-none border-0 bg-transparent p-3 font-mono text-base focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm"
        />
      ) : (
        <textarea
          {...sharedTextareaProps}
          // biome-ignore lint/a11y/noAutofocus: Focus can be requested by an explicit user action.
          autoFocus={autoFocus}
          className="min-h-0 w-full flex-1 resize-none border-0 bg-transparent p-4 font-mono text-base focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm"
        />
      )}
      <output
        id={keyboardHelpId}
        aria-live="polite"
        className={cn(
          "shrink-0 border-t border-gray-200 bg-gray-50 px-3 py-1 text-[11px] leading-4 text-gray-600",
          tabEscapeReady && "bg-blue-50 text-blue-700",
        )}
      >
        {keyboardHelp}
      </output>
    </div>
  );
}
