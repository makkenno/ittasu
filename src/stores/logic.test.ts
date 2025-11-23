import { describe, expect, it } from "vitest";
import type { TaskEdge } from "../types/edge";
import type { TaskNode } from "../types/task";
import { findNextTask } from "./logic";

const createNode = (
  id: string,
  parentId: string | null,
  completed: boolean,
  y: number,
  x: number = 0,
): TaskNode => ({
  id,
  parentId,
  completed,
  title: id,
  memo: "",
  position: { x, y },
  createdAt: new Date(),
  updatedAt: new Date(),
  completedAt: completed ? new Date() : null,
});

const createEdge = (source: string, target: string): TaskEdge => ({
  id: `${source}->${target}`,
  source,
  target,
  parentId: null,
});

describe("findNextTask", () => {
  it("should pick the first incomplete task in a simple list", () => {
    const nodes = [
      createNode("A", null, false, 0),
      createNode("B", null, false, 100),
      createNode("C", null, false, 200),
    ];
    expect(findNextTask(nodes, [])).toBe("A");
  });

  it("should skip completed tasks", () => {
    const nodes = [
      createNode("A", null, true, 0),
      createNode("B", null, false, 100),
    ];
    expect(findNextTask(nodes, [])).toBe("B");
  });

  it("should respect dependencies (A -> B)", () => {
    const nodes = [
      createNode("A", null, false, 0),
      createNode("B", null, false, 100),
    ];
    const edges = [createEdge("A", "B")];
    expect(findNextTask(nodes, edges)).toBe("A");
  });

  it("should go to dependent task if dependency is completed (A done -> B)", () => {
    const nodes = [
      createNode("A", null, true, 0),
      createNode("B", null, false, 100),
    ];
    const edges = [createEdge("A", "B")];
    expect(findNextTask(nodes, edges)).toBe("B");
  });

  it("should drill down into children", () => {
    const nodes = [
      createNode("Root", null, false, 0),
      createNode("Child1", "Root", false, 0),
      createNode("Child2", "Root", false, 100),
    ];
    expect(findNextTask(nodes, [])).toBe("Child1");
  });

  it("should drill down into children even if parent has siblings", () => {
    const nodes = [
      createNode("Root1", null, false, 0),
      createNode("Root2", null, false, 100),
      createNode("Child1", "Root1", false, 0),
    ];
    expect(findNextTask(nodes, [])).toBe("Child1");
  });

  it("should skip completed children", () => {
    const nodes = [
      createNode("Root", null, false, 0),
      createNode("Child1", "Root", true, 0),
      createNode("Child2", "Root", false, 100),
    ];
    expect(findNextTask(nodes, [])).toBe("Child2");
  });

  it("should return null if all tasks are completed", () => {
    const nodes = [
      createNode("Root", null, true, 0),
      createNode("Child1", "Root", true, 0),
    ];
    expect(findNextTask(nodes, [])).toBe(null);
  });

  it("should handle deep nesting (A -> B -> C)", () => {
    const nodes = [
      createNode("A", null, false, 0),
      createNode("B", "A", false, 0),
      createNode("C", "B", false, 0),
    ];
    expect(findNextTask(nodes, [])).toBe("C");
  });

  it("should handle root dependency with children", () => {
    const nodes = [
      createNode("Root1", null, false, 0),
      createNode("Root2", null, false, 100),
      createNode("Child1", "Root1", false, 0),
    ];
    const edges = [createEdge("Root1", "Root2")];
    expect(findNextTask(nodes, edges)).toBe("Child1");
  });

  it("should return incomplete predecessor even if successor is completed", () => {
    const nodes = [
      createNode("Root1", null, false, 0),
      createNode("Child2", "Root1", true, 0),
      createNode("Root2", null, false, 100),
      createNode("Child3", "Root1", false, 0),
      createNode("Child1", "Root1", false, 0),
    ];
    const edges = [
      createEdge("Root1", "Root2"),
      createEdge("Child1", "Child2"),
      createEdge("Child2", "Child3"),
    ];
    expect(findNextTask(nodes, edges)).toBe("Child1");
  });
});
