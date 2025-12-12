import type { TaskEdge } from "../types/edge";
import type { TaskNode } from "../types/task";

export const sortByDependencies = (
  childNodes: TaskNode[],
  edges: TaskEdge[],
  parentId: string | null,
): TaskNode[] => {
  const childEdges = edges.filter((edge) => edge.parentId === parentId);
  const sorted: TaskNode[] = [];
  const visited = new Set<string>();

  const visit = (nodeId: string) => {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const deps = childEdges.filter((edge) => edge.target === nodeId);
    for (const dep of deps) {
      visit(dep.source);
    }

    const node = childNodes.find((n) => n.id === nodeId);
    if (node) {
      sorted.push(node);
    }
  };

  for (const node of childNodes) {
    visit(node.id);
  }

  return sorted;
};

const generateTaskMarkdown = (
  task: TaskNode,
  nodes: TaskNode[],
  edges: TaskEdge[],
  level: number,
): string => {
  const lines: string[] = [];
  const displayLevel = Math.min(level, 6);
  const heading = "#".repeat(displayLevel);
  lines.push(`${heading} ${task.title}`);
  lines.push("");

  if (task.memo) {
    const processHeader = (match: string, p1: string) => {
      const currentLevel = p1.length;
      const totalLevel = Math.min(displayLevel + currentLevel, 6);
      return (match.startsWith("\n") ? "\n" : "") + "#".repeat(totalLevel);
    };

    const processedMemo = task.memo
      .replace(/^(#+)/g, processHeader)
      .replace(/\n(#+)/g, processHeader);

    lines.push(processedMemo);
    lines.push("");
  }

  const children = nodes.filter((node) => node.parentId === task.id);
  const sortedChildren = sortByDependencies(children, edges, task.id);

  for (const child of sortedChildren) {
    lines.push(generateTaskMarkdown(child, nodes, edges, level + 1));
  }

  return lines.join("\n");
};

export const generateMarkdown = (
  nodes: TaskNode[],
  edges: TaskEdge[],
  taskId: string | null,
): string => {
  if (taskId === null) {
    const rootNodes = nodes.filter((node) => node.parentId === null);
    const sortedRootNodes = sortByDependencies(rootNodes, edges, null);
    const lines: string[] = [];

    for (const rootNode of sortedRootNodes) {
      lines.push(generateTaskMarkdown(rootNode, nodes, edges, 1));
    }

    return lines.join("\n");
  }

  const task = nodes.find((node) => node.id === taskId);
  if (!task) return "";

  return generateTaskMarkdown(task, nodes, edges, 1);
};

const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-\u0080-\uFFFF]+/g, "");
};

export interface MarkdownHeading {
  level: number;
  text: string;
  id: string;
}

export class Slugger {
  private counts = new Map<string, number>();

  slug(text: string): string {
    let id = slugify(text);
    const count = this.counts.get(id) || 0;

    // Save the original ID for next time if it matches
    const originalId = id;

    if (count > 0) {
      id = `${originalId}-${count}`;
    }

    // Correct logic:
    // 1. slugify(text) -> s
    // 2. if s in map, increment s's count, append count to s.
    // 3. store s in map.

    this.counts.set(originalId, count + 1);
    return id;
  }

  reset() {
    this.counts.clear();
  }
}
