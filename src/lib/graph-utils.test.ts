import { describe, expect, it } from "vitest";
import type { TaskEdge } from "../types/edge";
import type { TaskNode } from "../types/task";
import {
  findFreePosition,
  getLayoutedElements,
  getLinearTaskOrder,
} from "./graph-utils";

const createTask = (id: string): TaskNode => ({
  id,
  title: id,
  memo: "",
  completed: false,
  parentId: null,
  projectId: null,
  position: { x: 0, y: 0 },
  createdAt: new Date(0),
  updatedAt: new Date(0),
  completedAt: null,
});

const edges: TaskEdge[] = [
  { id: "a-b", source: "a", target: "b", parentId: null },
  { id: "b-c", source: "b", target: "c", parentId: null },
];

const getPosition = (nodes: TaskNode[], id: string) => {
  const node = nodes.find((candidate) => candidate.id === id);
  if (!node) throw new Error(`Task ${id} was not laid out`);
  return node.position;
};

describe("getLayoutedElements", () => {
  it("lays a chain from left to right on desktop", () => {
    const nodes = getLayoutedElements(
      [createTask("a"), createTask("b"), createTask("c")],
      edges,
      new Map(),
      "LR",
    );
    const a = getPosition(nodes, "a");
    const b = getPosition(nodes, "b");
    const c = getPosition(nodes, "c");

    expect(a.x).toBeLessThan(b.x);
    expect(b.x).toBeLessThan(c.x);
  });

  it("lays a chain from top to bottom on compact screens", () => {
    const nodes = getLayoutedElements(
      [createTask("a"), createTask("b"), createTask("c")],
      edges,
      new Map(),
      "TB",
    );
    const a = getPosition(nodes, "a");
    const b = getPosition(nodes, "b");
    const c = getPosition(nodes, "c");

    expect(a.y).toBeLessThan(b.y);
    expect(b.y).toBeLessThan(c.y);
  });
});

describe("findFreePosition", () => {
  it("searches downward for free space in a vertical layout", () => {
    const position = findFreePosition(
      { x: 0, y: 0 },
      [{ position: { x: 0, y: 0 }, width: 200, height: 100 }],
      "TB",
    );

    expect(position.x).toBe(0);
    expect(position.y).toBeGreaterThan(100);
  });
});

describe("getLinearTaskOrder", () => {
  it("returns tasks in edge order", () => {
    const order = getLinearTaskOrder(
      [createTask("c"), createTask("a"), createTask("b")],
      edges,
      null,
    );

    expect(order?.map((task) => task.id)).toEqual(["a", "b", "c"]);
  });

  it("rejects branches", () => {
    const order = getLinearTaskOrder(
      [createTask("a"), createTask("b"), createTask("c")],
      [
        { id: "a-b", source: "a", target: "b", parentId: null },
        { id: "a-c", source: "a", target: "c", parentId: null },
      ],
      null,
    );

    expect(order).toBeNull();
  });

  it("rejects cycles", () => {
    const order = getLinearTaskOrder(
      [createTask("a"), createTask("b")],
      [
        { id: "a-b", source: "a", target: "b", parentId: null },
        { id: "b-a", source: "b", target: "a", parentId: null },
      ],
      null,
    );

    expect(order).toBeNull();
  });

  it("rejects disconnected tasks", () => {
    const order = getLinearTaskOrder(
      [createTask("a"), createTask("b"), createTask("c")],
      [{ id: "a-b", source: "a", target: "b", parentId: null }],
      null,
    );

    expect(order).toBeNull();
  });
});
