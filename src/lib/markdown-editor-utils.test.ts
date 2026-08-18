import { describe, expect, it } from "vitest";
import {
  applyMarkdownFormat,
  continueMarkdownList,
} from "./markdown-editor-utils";

describe("applyMarkdownFormat", () => {
  it("wraps selected text with inline Markdown", () => {
    expect(applyMarkdownFormat("hello world", 6, 11, "bold")).toEqual({
      value: "hello **world**",
      selectionStart: 8,
      selectionEnd: 13,
    });
  });

  it("inserts and selects a placeholder without a selection", () => {
    expect(applyMarkdownFormat("", 0, 0, "italic")).toEqual({
      value: "_斜体_",
      selectionStart: 1,
      selectionEnd: 3,
    });
  });

  it("prefixes every selected line as a list", () => {
    expect(applyMarkdownFormat("first\nsecond", 0, 12, "bulletList")).toEqual({
      value: "- first\n- second",
      selectionStart: 0,
      selectionEnd: 16,
    });
  });

  it("numbers every selected line", () => {
    const result = applyMarkdownFormat("first\nsecond", 0, 12, "orderedList");

    expect(result.value).toBe("1. first\n2. second");
  });

  it("selects the URL when adding a link to selected text", () => {
    expect(applyMarkdownFormat("OpenAI", 0, 6, "link")).toEqual({
      value: "[OpenAI](https://)",
      selectionStart: 9,
      selectionEnd: 17,
    });
  });

  it("indents and outdents selected lines", () => {
    const indented = applyMarkdownFormat("- first\n- second", 0, 16, "indent");
    expect(indented.value).toBe("  - first\n  - second");

    const outdented = applyMarkdownFormat(
      indented.value,
      indented.selectionStart,
      indented.selectionEnd,
      "outdent",
    );
    expect(outdented.value).toBe("- first\n- second");
  });

  it("indents the current list item when the selection is a caret", () => {
    const indented = applyMarkdownFormat("- parent\n- child", 16, 16, "indent");

    expect(indented).toEqual({
      value: "- parent\n  - child",
      selectionStart: 18,
      selectionEnd: 18,
    });

    expect(
      applyMarkdownFormat(
        indented.value,
        indented.selectionStart,
        indented.selectionEnd,
        "outdent",
      ),
    ).toEqual({
      value: "- parent\n- child",
      selectionStart: 16,
      selectionEnd: 16,
    });
  });
});

describe("continueMarkdownList", () => {
  it("continues bullet lists", () => {
    expect(continueMarkdownList("- first", 7, 7)).toEqual({
      value: "- first\n- ",
      selectionStart: 10,
      selectionEnd: 10,
    });
  });

  it("increments ordered lists", () => {
    expect(continueMarkdownList("9. ninth", 8, 8)?.value).toBe(
      "9. ninth\n10. ",
    );
  });

  it("continues task lists with an unchecked item", () => {
    expect(continueMarkdownList("- [x] done", 10, 10)?.value).toBe(
      "- [x] done\n- [ ] ",
    );
  });

  it("exits an empty list item", () => {
    expect(continueMarkdownList("- first\n- ", 10, 10)).toEqual({
      value: "- first\n",
      selectionStart: 8,
      selectionEnd: 8,
    });
  });

  it("leaves ordinary lines unchanged", () => {
    expect(continueMarkdownList("plain text", 10, 10)).toBeNull();
  });
});
