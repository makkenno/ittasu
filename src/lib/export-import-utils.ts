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
  createdAt: v.pipe(v.string(), v.transform((input) => new Date(input))),
  updatedAt: v.pipe(v.string(), v.transform((input) => new Date(input))),
  completedAt: v.nullable(v.pipe(v.string(), v.transform((input) => new Date(input)))),
});

const TaskEdgeSchema = v.object({
  id: v.string(),
  source: v.string(),
  target: v.string(),
  parentId: v.nullable(v.string()),
});

export const ExportedDataSchema = v.object({
  version: v.number(),
  nodes: v.array(TaskNodeSchema),
  edges: v.array(TaskEdgeSchema),
});

export type ExportedData = v.InferOutput<typeof ExportedDataSchema>;

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

  const newEdges = edges.map((edge) => {
    return {
      ...edge,
      id: `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source: idMap.get(edge.source)!,
      target: idMap.get(edge.target)!,
      parentId:
        edge.parentId && exportedNodeIds.has(edge.parentId)
          ? idMap.get(edge.parentId)!
          : targetParentId,
    };
  });

  return { nodes: newNodes, edges: newEdges };
};
