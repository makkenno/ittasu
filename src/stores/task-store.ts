import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
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
import { findNextTask } from "./logic";

interface TaskStore {
  nodes: TaskNode[];
  edges: TaskEdge[];
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
    tasks: {
      title: string;
      memo?: string;
      position: { x: number; y: number };
    }[];
    edges: { sourceIndex: number; targetIndex: number }[];
  }) => void;

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
        tasks: {
          title: string;
          memo?: string;
          position: { x: number; y: number };
        }[];
        edges: { sourceIndex: number; targetIndex: number }[];
      }) => {
        const { currentTaskId } = get();
        const now = Date.now();

        const newTasks: TaskNode[] = template.tasks.map((task, index) => ({
          id: `task-${now}-${index}`,
          title: task.title,
          memo: task.memo || "",
          completed: false,
          parentId: currentTaskId,
          position: task.position,
          createdAt: new Date(),
          updatedAt: new Date(),
          completedAt: null,
        }));

        const newEdges: TaskEdge[] = template.edges
          .map((edge, index) => {
            const sourceTask = newTasks[edge.sourceIndex];
            const targetTask = newTasks[edge.targetIndex];

            if (!sourceTask || !targetTask) return null;

            return {
              id: `edge-${now}-${index}`,
              source: sourceTask.id,
              target: targetTask.id,
              parentId: currentTaskId,
            };
          })
          .filter((edge): edge is TaskEdge => edge !== null);

        set((state) => ({
          nodes: [...state.nodes, ...newTasks],
          edges: [...state.edges, ...newEdges],
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
