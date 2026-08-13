export type MarkdownFormat =
  | "heading"
  | "bold"
  | "italic"
  | "link"
  | "code"
  | "quote"
  | "bulletList"
  | "orderedList"
  | "indent"
  | "outdent";

interface MarkdownEdit {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

const wrapSelection = (
  value: string,
  selectionStart: number,
  selectionEnd: number,
  prefix: string,
  suffix: string,
  placeholder: string,
): MarkdownEdit => {
  const selectedText = value.slice(selectionStart, selectionEnd);
  const content = selectedText || placeholder;
  const replacement = `${prefix}${content}${suffix}`;

  return {
    value: `${value.slice(0, selectionStart)}${replacement}${value.slice(selectionEnd)}`,
    selectionStart: selectionStart + prefix.length,
    selectionEnd: selectionStart + prefix.length + content.length,
  };
};

const prefixSelectedLines = (
  value: string,
  selectionStart: number,
  selectionEnd: number,
  format: "heading" | "quote" | "bulletList" | "orderedList",
): MarkdownEdit => {
  const previousCharacterIndex = selectionStart === 0 ? -1 : selectionStart - 1;
  const lineStart = value.lastIndexOf("\n", previousCharacterIndex) + 1;
  const nextLineBreak = value.indexOf("\n", selectionEnd);
  const lineEnd = nextLineBreak === -1 ? value.length : nextLineBreak;
  const selectedLines = value.slice(lineStart, lineEnd).split("\n");
  const transformedLines = selectedLines.map((line, index) => {
    switch (format) {
      case "heading":
        return `## ${line}`;
      case "quote":
        return `> ${line}`;
      case "bulletList":
        return `- ${line}`;
      case "orderedList":
        return `${index + 1}. ${line}`;
      default:
        return line;
    }
  });
  const replacement = transformedLines.join("\n");
  const firstPrefixLength =
    replacement.length - selectedLines.join("\n").length;

  return {
    value: `${value.slice(0, lineStart)}${replacement}${value.slice(lineEnd)}`,
    selectionStart:
      selectedLines.length === 1
        ? selectionStart + firstPrefixLength
        : lineStart,
    selectionEnd:
      selectedLines.length === 1
        ? selectionEnd + firstPrefixLength
        : lineStart + replacement.length,
  };
};

const indentSelectedLines = (
  value: string,
  selectionStart: number,
  selectionEnd: number,
  outdent: boolean,
): MarkdownEdit => {
  const previousCharacterIndex = selectionStart === 0 ? -1 : selectionStart - 1;
  const lineStart = value.lastIndexOf("\n", previousCharacterIndex) + 1;
  const nextLineBreak = value.indexOf("\n", selectionEnd);
  const lineEnd = nextLineBreak === -1 ? value.length : nextLineBreak;
  const selectedLines = value.slice(lineStart, lineEnd).split("\n");
  const transformedLines = selectedLines.map((line) =>
    outdent ? line.replace(/^(?: {1,2}|\t)/, "") : `  ${line}`,
  );
  const replacement = transformedLines.join("\n");
  const firstLine = selectedLines[0] ?? "";
  const transformedFirstLine = transformedLines[0] ?? "";
  const firstLineDelta = transformedFirstLine.length - firstLine.length;

  return {
    value: `${value.slice(0, lineStart)}${replacement}${value.slice(lineEnd)}`,
    selectionStart:
      selectedLines.length === 1
        ? Math.max(lineStart, selectionStart + firstLineDelta)
        : lineStart,
    selectionEnd:
      selectedLines.length === 1
        ? Math.max(lineStart, selectionEnd + firstLineDelta)
        : lineStart + replacement.length,
  };
};

const insertLink = (
  value: string,
  selectionStart: number,
  selectionEnd: number,
): MarkdownEdit => {
  const selectedText = value.slice(selectionStart, selectionEnd);
  const label = selectedText || "リンクテキスト";
  const url = "https://";
  const replacement = `[${label}](${url})`;
  const replacementStart = selectionStart;

  return {
    value: `${value.slice(0, selectionStart)}${replacement}${value.slice(selectionEnd)}`,
    selectionStart: selectedText
      ? replacementStart + label.length + 3
      : replacementStart + 1,
    selectionEnd: selectedText
      ? replacementStart + label.length + 3 + url.length
      : replacementStart + 1 + label.length,
  };
};

export const applyMarkdownFormat = (
  value: string,
  selectionStart: number,
  selectionEnd: number,
  format: MarkdownFormat,
): MarkdownEdit => {
  switch (format) {
    case "bold":
      return wrapSelection(
        value,
        selectionStart,
        selectionEnd,
        "**",
        "**",
        "太字",
      );
    case "italic":
      return wrapSelection(
        value,
        selectionStart,
        selectionEnd,
        "_",
        "_",
        "斜体",
      );
    case "code":
      return wrapSelection(
        value,
        selectionStart,
        selectionEnd,
        "`",
        "`",
        "コード",
      );
    case "link":
      return insertLink(value, selectionStart, selectionEnd);
    case "heading":
    case "quote":
    case "bulletList":
    case "orderedList":
      return prefixSelectedLines(value, selectionStart, selectionEnd, format);
    case "indent":
      return indentSelectedLines(value, selectionStart, selectionEnd, false);
    case "outdent":
      return indentSelectedLines(value, selectionStart, selectionEnd, true);
  }
};

const listLinePattern = /^(\s*)([-+*]|\d+\.|>)\s+(?:(\[[ xX]\])\s+)?(.*)$/;

export const continueMarkdownList = (
  value: string,
  selectionStart: number,
  selectionEnd: number,
): MarkdownEdit | null => {
  if (selectionStart !== selectionEnd) return null;

  const previousCharacterIndex = selectionStart === 0 ? -1 : selectionStart - 1;
  const lineStart = value.lastIndexOf("\n", previousCharacterIndex) + 1;
  const lineBreak = value.indexOf("\n", selectionStart);
  const lineEnd = lineBreak === -1 ? value.length : lineBreak;
  const currentLine = value.slice(lineStart, lineEnd);
  const beforeCursor = value.slice(lineStart, selectionStart);
  const match = beforeCursor.match(listLinePattern);
  if (!match) return null;

  const indent = match[1] ?? "";
  const marker = match[2] ?? "-";
  const checkbox = match[3];
  const contentBeforeCursor = match[4] ?? "";
  const currentLineContent = currentLine.match(listLinePattern)?.[4] ?? "";

  if (
    contentBeforeCursor.trim() === "" &&
    currentLineContent.trim() === "" &&
    selectionStart === lineEnd
  ) {
    return {
      value: `${value.slice(0, lineStart)}${value.slice(selectionStart)}`,
      selectionStart: lineStart,
      selectionEnd: lineStart,
    };
  }

  const orderedNumber = marker.match(/^(\d+)\.$/)?.[1];
  const nextMarker = orderedNumber
    ? `${Number.parseInt(orderedNumber, 10) + 1}.`
    : marker;
  const nextPrefix = `${indent}${nextMarker} ${checkbox ? "[ ] " : ""}`;
  const insertion = `\n${nextPrefix}`;
  const nextCursor = selectionStart + insertion.length;

  return {
    value: `${value.slice(0, selectionStart)}${insertion}${value.slice(selectionEnd)}`,
    selectionStart: nextCursor,
    selectionEnd: nextCursor,
  };
};
