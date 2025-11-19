import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { indexedDBStorage } from "../lib/indexeddb-storage";
import {
  sampleChildEdges,
  sampleChildNodes,
  sampleEdges,
  sampleNodes,
} from "../lib/sample-data";
import type { TaskEdge } from "../types/edge";
import type { TaskNode } from "../types/task";

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
    position: { x: number; y: number }
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
              : node
          ),
        }));
      },

      updateTaskMemo: (taskId: string, memo: string) => {
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === taskId ? { ...node, memo, updatedAt: new Date() } : node
          ),
        }));
      },

      toggleTaskComplete: (taskId: string) => {
        set((state) => {
          const newNodes = state.nodes.map((node) => {
            if (node.id === taskId) {
              const completed = !node.completed;
              console.log(
                `Toggling task ${taskId}: ${node.completed} -> ${completed}`
              );
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
        position: { x: number; y: number }
      ) => {
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === taskId
              ? { ...node, position, updatedAt: new Date() }
              : node
          ),
        }));
      },

      addChildTask: (
        position: { x: number; y: number } = { x: 100, y: 100 }
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

        const tasksToRemove = new Set<string>();
        const collectDescendants = (id: string) => {
          tasksToRemove.add(id);
          const children = nodes.filter((node) => node.parentId === id);
          for (const child of children) {
            collectDescendants(child.id);
          }
        };
        collectDescendants(taskId);

        set((state) => ({
          nodes: state.nodes.filter((node) => !tasksToRemove.has(node.id)),
          edges: state.edges.filter(
            (edge) =>
              !tasksToRemove.has(edge.source) && !tasksToRemove.has(edge.target)
          ),
        }));
      },

      setCurrentTaskId: (taskId: string | null) => {
        set({ currentTaskId: taskId });
      },

      goToParent: () => {
        const { currentTaskId, nodes } = get();
        if (!currentTaskId) return;

        const currentTask = nodes.find((node) => node.id === currentTaskId);
        if (!currentTask) return;

        if (currentTask.parentId === null) {
          set({ currentTaskId: null });
          get().removeTask(currentTaskId);
          return;
        }

        set({ currentTaskId: currentTask.parentId });
      },

      goToNextTask: () => {
        const { nodes, edges, currentTaskId } = get();

        const currentViewNodes = nodes.filter(
          (node) => node.parentId === currentTaskId
        );

        const incompleteTasks = currentViewNodes.filter(
          (node) => !node.completed
        );

        if (incompleteTasks.length === 0) return;

        const currentViewEdges = edges.filter(
          (edge) => edge.parentId === currentTaskId
        );

        for (const task of incompleteTasks) {
          const dependencies = currentViewEdges.filter(
            (edge) => edge.target === task.id
          );

          const allDependenciesCompleted = dependencies.every((dep) => {
            const sourceTask = nodes.find((node) => node.id === dep.source);
            return sourceTask?.completed;
          });

          if (dependencies.length === 0 || allDependenciesCompleted) {
            set({ currentTaskId: task.id });
            return;
          }
        }

        set({ currentTaskId: incompleteTasks[0]?.id });
      },

      generateMarkdown: (taskId: string | null) => {
        const { nodes, edges } = get();

        const sortByDependencies = (
          childNodes: TaskNode[],
          parentId: string | null
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
          level: number
        ): string => {
          const lines: string[] = [];
          const heading = "#".repeat(level);
          lines.push(`${heading} ${task.title}`);
          lines.push("");

          if (task.memo) {
            lines.push(task.memo);
            lines.push("");
          }

          const children = nodes.filter((node) => node.parentId === task.id);
          const sortedChildren = sortByDependencies(children, task.id);

          for (const child of sortedChildren) {
            lines.push(generateTaskMarkdown(child, level + 1));
          }

          return lines.join("\n");
        };

        const generateRootMarkdown = (): string => {
          const rootNodes = nodes.filter((node) => node.parentId === null);
          const sortedRootNodes = sortByDependencies(rootNodes, null);
          const lines: string[] = [];

          for (const rootNode of sortedRootNodes) {
            lines.push(generateTaskMarkdown(rootNode, 1));
          }

          return lines.join("\n");
        };

        if (taskId === null) {
          return generateRootMarkdown();
        }

        const task = nodes.find((node) => node.id === taskId);
        if (!task) return "";

        return generateTaskMarkdown(task, 1);
      },

      selectTask: (taskId: string) => {
        set({ selectedTaskId: taskId });
      },
    }),
    {
      name: "task-storage",
      storage: createJSONStorage(() => indexedDBStorage),
    }
  )
);
