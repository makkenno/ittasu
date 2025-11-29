import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { defaultTemplates } from "../data/templates";
import {
  type ExportedData,
  generateImportedData,
} from "../lib/export-import-utils";
import { getDescendantIds } from "../lib/graph-utils";
import { indexedDBStorage } from "../lib/indexeddb-storage";
import {
  sampleChildEdges,
  sampleChildNodes,
  sampleEdges,
  sampleNodes,
} from "../lib/sample-data";
import type { TaskEdge } from "../types/edge";
import type { TaskNode } from "../types/task";
import type { TaskTemplate, TemplateTask } from "../types/template";
import { findNextTask } from "./logic";

interface TaskStore {
  nodes: TaskNode[];
  edges: TaskEdge[];
  templates: TaskTemplate[];
  currentTaskId: string | null;
  selectedTaskId: string | null;

  updateTaskTitle: (taskId: string, title: string) => void;

  updateTaskMemo: (taskId: string, memo: string) => void;

  toggleTaskComplete: (taskId: string) => void;

  updateTaskPosition: (
    taskId: string,
    position: { x: number; y: number },
  ) => void;

  addChildTask: (position?: { x: number; y: number }) => void;

  addTemplate: (template: {
    tasks: (TemplateTask & { position: { x: number; y: number } })[];
    edges: { sourceIndex: number; targetIndex: number }[];
  }) => void;

  saveTemplate: (
    name: string,
    description: string,
    selectedNodeIds: Set<string>,
  ) => void;

  deleteTemplate: (templateId: string) => void;

  addEdge: (source: string, target: string) => void;

  removeEdge: (edgeId: string) => void;

  removeTask: (taskId: string) => void;

  setCurrentTaskId: (taskId: string | null) => void;

  goToParent: () => void;

  goToNextTask: () => void;

  selectTask: (taskId: string | null) => void;

  importSubgraph: (data: ExportedData) => void;
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      nodes: [...sampleNodes, ...sampleChildNodes],
      edges: [...sampleEdges, ...sampleChildEdges],
      templates: defaultTemplates,
      currentTaskId: null,
      selectedTaskId: null,

      importSubgraph: (data: ExportedData) => {
        const { currentTaskId } = get();
        const { nodes: newNodes, edges: newEdges } = generateImportedData(
          data,
          currentTaskId,
        );

        set((state) => ({
          nodes: [...state.nodes, ...newNodes],
          edges: [...state.edges, ...newEdges],
        }));
      },

      updateTaskTitle: (taskId: string, title: string) => {
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === taskId
              ? { ...node, title, updatedAt: new Date() }
              : node,
          ),
        }));
      },

      updateTaskMemo: (taskId: string, memo: string) => {
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === taskId
              ? { ...node, memo, updatedAt: new Date() }
              : node,
          ),
        }));
      },

      toggleTaskComplete: (taskId: string) => {
        set((state) => {
          const newNodes = state.nodes.map((node) => {
            if (node.id === taskId) {
              const completed = !node.completed;
              return {
                ...node,
                completed,
                updatedAt: new Date(),
                completedAt: completed ? new Date() : null,
              };
            }
            return node;
          });
          return { nodes: newNodes };
        });
      },

      updateTaskPosition: (
        taskId: string,
        position: { x: number; y: number },
      ) => {
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === taskId
              ? { ...node, position, updatedAt: new Date() }
              : node,
          ),
        }));
      },

      addChildTask: (
        position: { x: number; y: number } = { x: 100, y: 100 },
      ) => {
        const { currentTaskId } = get();
        const newTaskId = `task-${Date.now()}`;
        const newTask: TaskNode = {
          id: newTaskId,
          title: "",
          memo: "",
          completed: false,
          parentId: currentTaskId,
          position,
          createdAt: new Date(),
          updatedAt: new Date(),
          completedAt: null,
        };

        set((state) => ({
          selectedTaskId: newTaskId,
          nodes: [...state.nodes, newTask],
        }));
      },

      addTemplate: (template: {
        tasks: (TemplateTask & { position: { x: number; y: number } })[];
        edges: { sourceIndex: number; targetIndex: number }[];
      }) => {
        const { currentTaskId } = get();
        const now = Date.now();
        const allNewNodes: TaskNode[] = [];
        const allNewEdges: TaskEdge[] = [];

        const processTask = (
          task: TemplateTask & { position: { x: number; y: number } },
          index: number,
          parentId: string | null,
          idPrefix: string,
        ): TaskNode => {
          const newTaskId = `task-${now}-${idPrefix}-${index}`;
          const newNode: TaskNode = {
            id: newTaskId,
            title: task.title,
            memo: task.memo || "",
            completed: false,
            parentId: parentId,
            position: task.position,
            createdAt: new Date(),
            updatedAt: new Date(),
            completedAt: null,
          };
          allNewNodes.push(newNode);

          if (task.children && task.children.length > 0) {
            const childTasks = task.children.map((c: TemplateTask) => ({
              ...c,
              position: c.relativePosition,
            }));
            processLevel(
              childTasks,
              task.edges || [],
              newTaskId,
              `${idPrefix}-${index}`,
            );
          }
          return newNode;
        };

        const processEdges = (
          levelEdges: { sourceIndex: number; targetIndex: number }[],
          levelNodes: TaskNode[],
          parentId: string | null,
          idPrefix: string,
        ) => {
          for (let i = 0; i < levelEdges.length; i++) {
            const edge = levelEdges[i];
            if (!edge) continue;

            const sourceNode = levelNodes[edge.sourceIndex];
            const targetNode = levelNodes[edge.targetIndex];

            if (sourceNode && targetNode) {
              allNewEdges.push({
                id: `edge-${now}-${idPrefix}-${i}`,
                source: sourceNode.id,
                target: targetNode.id,
                parentId: parentId,
              });
            }
          }
        };

        const processLevel = (
          tasks: (TemplateTask & { position: { x: number; y: number } })[],
          levelEdges: { sourceIndex: number; targetIndex: number }[],
          parentId: string | null,
          idPrefix: string,
        ) => {
          const levelNodes: TaskNode[] = [];

          for (let i = 0; i < tasks.length; i++) {
            const task = tasks[i];
            if (!task) continue;
            levelNodes.push(processTask(task, i, parentId, idPrefix));
          }

          processEdges(levelEdges, levelNodes, parentId, idPrefix);
        };

        processLevel(template.tasks, template.edges, currentTaskId, "root");

        set((state) => ({
          nodes: [...state.nodes, ...allNewNodes],
          edges: [...state.edges, ...allNewEdges],
        }));
      },

      saveTemplate: (
        name: string,
        description: string,
        selectedNodeIds: Set<string>,
      ) => {
        const { nodes, edges } = get();
        const selectedNodes = nodes.filter((node) =>
          selectedNodeIds.has(node.id),
        );

        if (selectedNodes.length === 0) return;

        // Calculate bounding box to normalize positions
        const minX = Math.min(...selectedNodes.map((n) => n.position.x));
        const minY = Math.min(...selectedNodes.map((n) => n.position.y));

        // Helper to recursively build template task tree
        const buildTemplateTask = (node: TaskNode): TemplateTask => {
          const children = nodes.filter((n) => n.parentId === node.id);
          const childEdges = edges.filter((e) => e.parentId === node.id);

          // Map children to TemplateTask
          const templateChildren = children.map(buildTemplateTask);

          // Map edges to indices
          const templateEdges = childEdges
            .map((edge) => {
              const sourceIndex = children.findIndex(
                (n) => n.id === edge.source,
              );
              const targetIndex = children.findIndex(
                (n) => n.id === edge.target,
              );
              if (sourceIndex === -1 || targetIndex === -1) return null;
              return { sourceIndex, targetIndex };
            })
            .filter(
              (e): e is { sourceIndex: number; targetIndex: number } =>
                e !== null,
            );

          return {
            title: node.title,
            memo: node.memo,
            relativePosition: {
              x: node.position.x, // For children, this is relative to parent's content area (conceptually)
              y: node.position.y,
            },
            children:
              templateChildren.length > 0 ? templateChildren : undefined,
            edges: templateEdges.length > 0 ? templateEdges : undefined,
          };
        };

        const templateTasks: TemplateTask[] = selectedNodes.map((node) => {
          const task = buildTemplateTask(node);
          // Adjust top-level position to be relative to the group's top-left
          task.relativePosition = {
            x: node.position.x - minX,
            y: node.position.y - minY,
          };
          return task;
        });

        // Edges between top-level selected nodes
        const topLevelEdges = edges
          .filter(
            (edge) =>
              selectedNodeIds.has(edge.source) &&
              selectedNodeIds.has(edge.target),
          )
          .map((edge) => {
            const sourceIndex = selectedNodes.findIndex(
              (n) => n.id === edge.source,
            );
            const targetIndex = selectedNodes.findIndex(
              (n) => n.id === edge.target,
            );
            if (sourceIndex === -1 || targetIndex === -1) return null;
            return { sourceIndex, targetIndex };
          })
          .filter(
            (e): e is { sourceIndex: number; targetIndex: number } =>
              e !== null,
          );

        const newTemplate: TaskTemplate = {
          id: `template-${Date.now()}`,
          name,
          description,
          tasks: templateTasks,
          edges: topLevelEdges,
        };

        set((state) => ({
          templates: [...state.templates, newTemplate],
        }));
      },

      deleteTemplate: (templateId: string) => {
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== templateId),
        }));
      },

      addEdge: (source: string, target: string) => {
        const { currentTaskId } = get();
        const newEdge: TaskEdge = {
          id: `edge-${Date.now()}`,
          source,
          target,
          parentId: currentTaskId,
        };

        set((state) => ({
          edges: [...state.edges, newEdge],
        }));
      },

      removeEdge: (edgeId: string) => {
        set((state) => ({
          edges: state.edges.filter((edge) => edge.id !== edgeId),
        }));
      },

      removeTask: (taskId: string) => {
        const { nodes } = get();

        const tasksToRemove = getDescendantIds(nodes, taskId);

        set((state) => ({
          nodes: state.nodes.filter((node) => !tasksToRemove.has(node.id)),
          edges: state.edges.filter(
            (edge) =>
              !tasksToRemove.has(edge.source) &&
              !tasksToRemove.has(edge.target),
          ),
        }));
      },

      setCurrentTaskId: (taskId: string | null) => {
        set({ currentTaskId: taskId, selectedTaskId: null });
      },

      goToParent: () => {
        const { currentTaskId, nodes } = get();
        if (!currentTaskId) return;

        const currentTask = nodes.find((node) => node.id === currentTaskId);

        if (!currentTask) {
          set({ currentTaskId: null, selectedTaskId: null });
          get().removeTask(currentTaskId);
          return;
        }

        set({ currentTaskId: currentTask.parentId, selectedTaskId: null });
      },

      goToNextTask: () => {
        const { nodes, edges } = get();
        const nextTaskId = findNextTask(nodes, edges);

        if (nextTaskId) {
          set({ currentTaskId: nextTaskId, selectedTaskId: null });
        }
      },

      selectTask: (taskId: string | null) => {
        set({ selectedTaskId: taskId });
      },
    }),
    {
      name: "task-storage",
      storage: createJSONStorage(() => indexedDBStorage),
    },
  ),
);
