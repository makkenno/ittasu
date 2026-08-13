import * as v from "valibot";
import type { TaskEdge } from "../types/edge";
import type { TaskNode } from "../types/task";
import { getDescendantIds } from "./graph-utils";

const TaskNodeSchema = v.object({
  id: v.string(),
  title: v.string(),
  memo: v.string(),
  completed: v.boolean(),
  position: v.object({
    x: v.number(),
    y: v.number(),
  }),
  parentId: v.nullable(v.string()),
  projectId: v.optional(v.nullable(v.string())),
  createdAt: v.pipe(
    v.string(),
    v.transform((input) => new Date(input)),
  ),
  updatedAt: v.pipe(
    v.string(),
    v.transform((input) => new Date(input)),
  ),
  completedAt: v.nullable(
    v.pipe(
      v.string(),
      v.transform((input) => new Date(input)),
    ),
  ),
});

const TaskEdgeSchema = v.object({
  id: v.string(),
  source: v.string(),
  target: v.string(),
  parentId: v.nullable(v.string()),
});

const ExportedDataSchema = v.object({
  version: v.number(),
  nodes: v.array(TaskNodeSchema),
  edges: v.array(TaskEdgeSchema),
});

export type ExportedData = v.InferOutput<typeof ExportedDataSchema>;

type ImportFormat = "json" | "markdown";

type ImportParseResult =
  | { success: true; data: ExportedData; format: ImportFormat }
  | { success: false; error: string };

const markdownListItemPattern = /^(\s*)[-+*]\s+(.+?)\s*$/;

const getIndentWidth = (indent: string): number =>
  Array.from(indent).reduce(
    (width, character) => width + (character === "\t" ? 2 : 1),
    0,
  );

type MarkdownListItemsResult =
  | { success: true; listItems: { indent: number; title: string }[] }
  | { success: false; error: string };

const extractMarkdownListItems = (text: string): MarkdownListItemsResult => {
  const listItems: { indent: number; title: string }[] = [];

  for (const [index, line] of text.split(/\r?\n/).entries()) {
    if (line.trim() === "") continue;

    const match = line.match(markdownListItemPattern);
    const indent = match?.[1];
    const title = match?.[2];
    if (indent === undefined || title === undefined) {
      return {
        success: false,
        error: `${index + 1}行目を箇条書きとして読み取れませんでした`,
      };
    }

    listItems.push({
      indent: getIndentWidth(indent),
      title,
    });
  }

  if (listItems.length === 0) {
    return { success: false, error: "インポートするタスクがありません" };
  }

  return { success: true, listItems };
};

const parseMarkdownTaskList = (text: string): ImportParseResult => {
  const extracted = extractMarkdownListItems(text);
  if (!extracted.success) return extracted;

  const now = new Date();
  const nodes: TaskNode[] = [];
  const edges: TaskEdge[] = [];
  const ancestorStack: { indent: number; id: string }[] = [];
  const previousSiblingByParent = new Map<string, string>();

  for (const [index, item] of extracted.listItems.entries()) {
    while (
      ancestorStack.length > 0 &&
      (ancestorStack.at(-1)?.indent ?? -1) >= item.indent
    ) {
      ancestorStack.pop();
    }

    const parentId = ancestorStack.at(-1)?.id ?? null;
    const id = `markdown-task-${index + 1}`;
    nodes.push({
      id,
      title: item.title,
      memo: "",
      completed: false,
      parentId,
      projectId: null,
      position: { x: 0, y: 0 },
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    });

    const scopeKey = parentId ?? "__root__";
    const previousSiblingId = previousSiblingByParent.get(scopeKey);
    if (previousSiblingId) {
      edges.push({
        id: `markdown-edge-${edges.length + 1}`,
        source: previousSiblingId,
        target: id,
        parentId,
      });
    }
    previousSiblingByParent.set(scopeKey, id);
    ancestorStack.push({ indent: item.indent, id });
  }

  return {
    success: true,
    format: "markdown",
    data: { version: 1, nodes, edges },
  };
};

export const parseImportText = (text: string): ImportParseResult => {
  const trimmedText = text.trim();
  if (!trimmedText) {
    return { success: false, error: "インポートする内容を入力してください" };
  }

  try {
    const json = JSON.parse(trimmedText);
    const result = v.safeParse(ExportedDataSchema, json);
    if (result.success) {
      return { success: true, data: result.output, format: "json" };
    }

    const firstIssue = result.issues[0];
    const path = firstIssue?.path?.map((part) => part.key).join(".");
    return {
      success: false,
      error: `JSONの形式が正しくありません${path ? ` (${path})` : ""}`,
    };
  } catch {
    if (trimmedText.startsWith("{") || trimmedText.startsWith("[")) {
      return { success: false, error: "JSONの構文が正しくありません" };
    }
  }

  return parseMarkdownTaskList(text);
};

export const exportSubgraph = (
  rootId: string,
  nodes: TaskNode[],
  edges: TaskEdge[],
): ExportedData => {
  const descendantIds = getDescendantIds(nodes, rootId);
  const nodesToExport = nodes.filter((node) => descendantIds.has(node.id));
  const edgesToExport = edges.filter(
    (edge) => descendantIds.has(edge.source) && descendantIds.has(edge.target),
  );

  return {
    version: 1,
    nodes: nodesToExport,
    edges: edgesToExport,
  };
};

export const exportSelectedNodes = (
  nodes: TaskNode[],
  edges: TaskEdge[],
  selectedNodeIds: Set<string>,
): ExportedData => {
  const nodesToExportSet = new Set<string>();

  for (const id of selectedNodeIds) {
    nodesToExportSet.add(id);
    const descendants = getDescendantIds(nodes, id);
    for (const descendantId of descendants) {
      nodesToExportSet.add(descendantId);
    }
  }

  const nodesToExport = nodes.filter((node) => nodesToExportSet.has(node.id));
  const edgesToExport = edges.filter(
    (edge) =>
      nodesToExportSet.has(edge.source) && nodesToExportSet.has(edge.target),
  );

  return {
    version: 1,
    nodes: nodesToExport,
    edges: edgesToExport,
  };
};

export const generateImportedData = (
  data: ExportedData,
  targetParentId: string | null,
): { nodes: TaskNode[]; edges: TaskEdge[] } => {
  const { nodes, edges } = data;
  const idMap = new Map<string, string>();

  const newNodes = nodes.map((node) => {
    const newId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    idMap.set(node.id, newId);
    return {
      ...node,
      id: newId,
      projectId: node.projectId ?? null,
      updatedAt: new Date(),
      createdAt: new Date(),
    };
  });

  const exportedNodeIds = new Set(nodes.map((n) => n.id));

  newNodes.forEach((node, index) => {
    const originalNode = nodes[index];
    if (!originalNode) return;

    if (originalNode.parentId && exportedNodeIds.has(originalNode.parentId)) {
      node.parentId = idMap.get(originalNode.parentId) || null;
    } else {
      node.parentId = targetParentId;
    }
  });

  const newEdges = edges
    .filter((edge) => idMap.has(edge.source) && idMap.has(edge.target))
    .map((edge) => {
      const newSource = idMap.get(edge.source);
      const newTarget = idMap.get(edge.target);

      if (!newSource || !newTarget) {
        throw new Error("Invalid edge reference");
      }

      let newParentId = targetParentId;
      if (edge.parentId && exportedNodeIds.has(edge.parentId)) {
        const mappedParentId = idMap.get(edge.parentId);
        if (mappedParentId) {
          newParentId = mappedParentId;
        }
      }

      return {
        ...edge,
        id: `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        source: newSource,
        target: newTarget,
        parentId: newParentId,
      };
    });

  return { nodes: newNodes, edges: newEdges };
};
