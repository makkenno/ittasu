import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { getDescendantIds } from "../lib/graph-utils";
import { indexedDBStorage } from "../lib/indexeddb-storage";
import { generateMarkdown } from "../lib/markdown-utils";
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

  addEdge: (source: string, target: string) => void;

  removeEdge: (edgeId: string) => void;

  removeTask: (taskId: string) => void;

  setCurrentTaskId: (taskId: string | null) => void;

  goToParent: () => void;

  goToNextTask: () => void;

  generateMarkdown: (taskId: string | null) => string;

  selectTask: (taskId: string) => void;
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      nodes: [...sampleNodes, ...sampleChildNodes],
      edges: [...sampleEdges, ...sampleChildEdges],
      currentTaskId: null,
      selectedTaskId: null,

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

      generateMarkdown: (taskId: string | null) => {
        const { nodes, edges } = get();
        return generateMarkdown(nodes, edges, taskId);
      },

      selectTask: (taskId: string) => {
        set({ selectedTaskId: taskId });
      },
    }),
    {
      name: "task-storage",
      storage: createJSONStorage(() => indexedDBStorage),
    },
  ),
);
