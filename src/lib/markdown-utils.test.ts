import { describe, expect, it } from "vitest";
import type { TaskNode } from "../types/task";
import { generateMarkdown } from "./markdown-utils";

const createNode = (
  id: string,
  title: string,
  memo: string,
  parentId: string | null,
): TaskNode => ({
  id,
  title,
  memo,
  parentId,
  completed: false,
  position: { x: 0, y: 0 },
  createdAt: new Date(),
  updatedAt: new Date(),
  completedAt: null,
});

describe("generateMarkdown", () => {
  it("should generate markdown for a single task", () => {
    const nodes = [createNode("1", "Task 1", "Memo 1", null)];
    const markdown = generateMarkdown(nodes, [], "1");
    expect(markdown).toContain("# Task 1");
    expect(markdown).toContain("Memo 1");
  });

  it("should shift headers in memo", () => {
    const nodes = [createNode("1", "Task 1", "# Header 1\n## Header 2", null)];
    const markdown = generateMarkdown(nodes, [], "1");
    expect(markdown).toContain("## Header 1");
    expect(markdown).toContain("### Header 2");
  });

  it("should shift headers in nested task memo", () => {
    const nodes = [
      createNode("1", "Root", "", null),
      createNode("2", "Child", "# Child Header", "1"),
    ];
    const markdown = generateMarkdown(nodes, [], "1");

    expect(markdown).toContain("### Child Header");
  });

  it("should not shift non-header text", () => {
    const nodes = [
      createNode("1", "Task 1", "Just some text # not a header", null),
    ];
    const markdown = generateMarkdown(nodes, [], "1");
    expect(markdown).toContain("Just some text # not a header");
  });
});
