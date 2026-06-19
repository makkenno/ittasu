import { describe, expect, it } from "vitest";
import type { TaskEdge } from "../types/edge";
import type { TaskNode } from "../types/task";
import { exportSelectedNodes } from "./export-import-utils";

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
