import { describe, expect, it } from "vitest";
import type { TaskEdge } from "../types/edge";
import type { TaskNode } from "../types/task";
import { exportSelectedNodes, parseImportText } from "./export-import-utils";

const createNode = (id: string, parentId: string | null): TaskNode => ({
  id,
  title: id,
  memo: "",
  completed: false,
  parentId,
  projectId: null,
  position: { x: 0, y: 0 },
  createdAt: new Date(0),
  updatedAt: new Date(0),
  completedAt: null,
});

describe("exportSelectedNodes", () => {
  it("exports selected nodes with their descendants and descendant edges", () => {
    const nodes = [
      createNode("parent", null),
      createNode("sibling", null),
      createNode("child-a", "parent"),
      createNode("child-b", "parent"),
      createNode("grandchild", "child-a"),
    ];
    const edges: TaskEdge[] = [
      {
        id: "parent-sibling",
        source: "parent",
        target: "sibling",
        parentId: null,
      },
      {
        id: "child-a-child-b",
        source: "child-a",
        target: "child-b",
        parentId: "parent",
      },
      {
        id: "child-a-grandchild",
        source: "child-a",
        target: "grandchild",
        parentId: "child-a",
      },
    ];

    const data = exportSelectedNodes(nodes, edges, new Set(["parent"]));

    expect(data.nodes.map((node) => node.id)).toEqual([
      "parent",
      "child-a",
      "child-b",
      "grandchild",
    ]);
    expect(data.edges.map((edge) => edge.id)).toEqual([
      "child-a-child-b",
      "child-a-grandchild",
    ]);
  });
});

describe("parseImportText", () => {
  it("parses nested Markdown lists into scoped task chains", () => {
    const result = parseImportText(`- hoge1
  - hoge2
  - hoge3
- hoge2`);

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.format).toBe("markdown");
    expect(
      result.data.nodes.map(({ id, title, parentId }) => ({
        id,
        title,
        parentId,
      })),
    ).toEqual([
      { id: "markdown-task-1", title: "hoge1", parentId: null },
      {
        id: "markdown-task-2",
        title: "hoge2",
        parentId: "markdown-task-1",
      },
      {
        id: "markdown-task-3",
        title: "hoge3",
        parentId: "markdown-task-1",
      },
      { id: "markdown-task-4", title: "hoge2", parentId: null },
    ]);
    expect(
      result.data.edges.map(({ source, target, parentId }) => ({
        source,
        target,
        parentId,
      })),
    ).toEqual([
      {
        source: "markdown-task-2",
        target: "markdown-task-3",
        parentId: "markdown-task-1",
      },
      {
        source: "markdown-task-1",
        target: "markdown-task-4",
        parentId: null,
      },
    ]);
  });

  it("supports deeper nesting and different unordered list markers", () => {
    const result = parseImportText(`* parent
  + child
    - grandchild
  * sibling`);

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.nodes.map((node) => node.parentId)).toEqual([
      null,
      "markdown-task-1",
      "markdown-task-2",
      "markdown-task-1",
    ]);
    expect(result.data.edges).toHaveLength(1);
    expect(result.data.edges[0]).toMatchObject({
      source: "markdown-task-2",
      target: "markdown-task-4",
      parentId: "markdown-task-1",
    });
  });

  it("continues to parse exported JSON", () => {
    const exportedData = {
      version: 1,
      nodes: [createNode("task", null)],
      edges: [],
    };

    const result = parseImportText(JSON.stringify(exportedData));

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.format).toBe("json");
    expect(result.data.nodes[0]?.createdAt).toBeInstanceOf(Date);
  });

  it("rejects text that is not a Markdown list", () => {
    expect(parseImportText("plain text")).toEqual({
      success: false,
      error: "1行目を箇条書きとして読み取れませんでした",
    });
  });
});
