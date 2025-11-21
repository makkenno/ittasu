interface MarkdownEditorProps {
  value: string;
  onChange?: (value: string) => void;
}

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    console.log("MarkdownEditor onChange:", e.target.value);
    onChange?.(e.target.value);
  };

  console.log("MarkdownEditor render, value:", value);

  return (
    <textarea
      value={value}
      onChange={handleChange}
      className="w-full h-full p-4 font-mono text-base sm:text-sm border-0 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
      placeholder="Markdown形式でメモを入力..."
    />
  );
}
