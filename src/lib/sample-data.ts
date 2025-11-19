import type { TaskEdge } from "../types/edge";
import type { TaskNode } from "../types/task";

export const sampleNodes: TaskNode[] = [
  {
    id: "task-1",
    title: "プロジェクト企画",
    memo: "# プロジェクト企画\n\n- 要件定義\n- スケジュール作成",
    completed: true,
    parentId: null,
    position: { x: 100, y: 100 },
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-02"),
    completedAt: new Date("2024-01-02"),
  },
  {
    id: "task-2",
    title: "設計",
    memo: "# 設計\n\n- UI設計\n- データベース設計",
    completed: false,
    parentId: null,
    position: { x: 300, y: 100 },
    createdAt: new Date("2024-01-03"),
    updatedAt: new Date("2024-01-03"),
    completedAt: null,
  },
  {
    id: "task-3",
    title: "実装",
    memo: "# 実装\n\n```typescript\nconst hello = 'world';\n```",
    completed: false,
    parentId: null,
    position: { x: 500, y: 100 },
    createdAt: new Date("2024-01-04"),
    updatedAt: new Date("2024-01-04"),
    completedAt: null,
  },
  {
    id: "task-4",
    title: "テスト",
    memo: "# テスト\n\n- ユニットテスト\n- E2Eテスト",
    completed: false,
    parentId: null,
    position: { x: 700, y: 100 },
    createdAt: new Date("2024-01-05"),
    updatedAt: new Date("2024-01-05"),
    completedAt: null,
  },
];

export const sampleEdges: TaskEdge[] = [
  {
    id: "edge-1",
    source: "task-1",
    target: "task-2",
    parentId: null,
  },
  {
    id: "edge-2",
    source: "task-2",
    target: "task-3",
    parentId: null,
  },
  {
    id: "edge-3",
    source: "task-3",
    target: "task-4",
    parentId: null,
  },
];

export const sampleChildNodes: TaskNode[] = [
  {
    id: "task-2-1",
    title: "UI設計",
    memo: "# UI設計\n\nFigmaでモックアップ作成",
    completed: false,
    parentId: "task-2",
    position: { x: 100, y: 100 },
    createdAt: new Date("2024-01-06"),
    updatedAt: new Date("2024-01-06"),
    completedAt: null,
  },
  {
    id: "task-2-2",
    title: "データベース設計",
    memo: "# データベース設計\n\nER図作成",
    completed: false,
    parentId: "task-2",
    position: { x: 400, y: 100 },
    createdAt: new Date("2024-01-07"),
    updatedAt: new Date("2024-01-07"),
    completedAt: null,
  },
];

export const sampleChildEdges: TaskEdge[] = [
  {
    id: "edge-2-1",
    source: "task-2-1",
    target: "task-2-2",
    parentId: "task-2",
  },
];
