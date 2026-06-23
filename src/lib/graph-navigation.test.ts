import { describe, expect, it } from "vitest";
import type { TaskEdge } from "../types/edge";
import type { TaskNode } from "../types/task";
import {
  buildMovables,
  findNearestMovable,
  findNearestNode,
  scoreDirection,
} from "./graph-navigation";

const createTask = (
  id: string,
  position: { x: number; y: number },
): TaskNode => ({
  id,
  title: id,
  memo: "",
  completed: false,
  parentId: null,
  projectId: null,
  position,
  createdAt: new Date(0),
  updatedAt: new Date(0),
  completedAt: null,
});

describe("scoreDirection", () => {
  it("accepts diagonal candidates in the requested half-plane", () => {
    expect(scoreDirection(100, 180, "l")).not.toBeNull();
    expect(scoreDirection(-100, 180, "h")).not.toBeNull();
    expect(scoreDirection(180, 100, "j")).not.toBeNull();
    expect(scoreDirection(180, -100, "k")).not.toBeNull();
  });

  it("rejects candidates behind the requested direction", () => {
    expect(scoreDirection(-1, 0, "l")).toBeNull();
    expect(scoreDirection(1, 0, "h")).toBeNull();
    expect(scoreDirection(0, -1, "j")).toBeNull();
    expect(scoreDirection(0, 1, "k")).toBeNull();
  });
});

describe("findNearestMovable", () => {
  it("moves to the nearest candidate even when it is diagonally offset", () => {
    const current = {
      type: "node" as const,
      id: "a",
      position: { x: 0, y: 0 },
    };
    const diagonal = {
      type: "node" as const,
      id: "b",
      position: { x: 100, y: 180 },
    };

    expect(findNearestMovable(current, [current, diagonal], "l")).toBe(
      diagonal,
    );
  });

  it("prefers a straighter candidate over a more offset candidate", () => {
    const current = {
      type: "node" as const,
      id: "a",
      position: { x: 0, y: 0 },
    };
    const offset = {
      type: "node" as const,
      id: "b",
      position: { x: 100, y: 180 },
    };
    const straight = {
      type: "node" as const,
      id: "c",
      position: { x: 200, y: 0 },
    };

    expect(findNearestMovable(current, [current, offset, straight], "l")).toBe(
      straight,
    );
  });
});

describe("findNearestNode", () => {
  it("does not select an edge midpoint while moving between tasks", () => {
    const first = {
      type: "node" as const,
      id: "first",
      position: { x: 0, y: 0 },
    };
    const second = {
      type: "node" as const,
      id: "second",
      position: { x: 300, y: 0 },
    };
    const edge = {
      type: "edge" as const,
      id: "first-second",
      position: { x: 150, y: 0 },
    };

    expect(findNearestNode(second, [first, edge, second], "h")).toBe(first);
  });
});

describe("buildMovables", () => {
  it("adds edge midpoints as movable targets", () => {
    const nodes = [
      createTask("a", { x: 0, y: 0 }),
      createTask("b", { x: 100, y: 50 }),
    ];
    const edges: TaskEdge[] = [
      { id: "a-b", source: "a", target: "b", parentId: null },
    ];

    expect(buildMovables(nodes, edges)).toContainEqual({
      type: "edge",
      id: "a-b",
      position: { x: 50, y: 25 },
    });
  });
});
