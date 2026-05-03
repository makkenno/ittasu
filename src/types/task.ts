export interface TaskNode {
  id: string;
  title: string;
  memo: string;
  completed: boolean;
  parentId: string | null;
  projectId: string | null;
  position: { x: number; y: number };
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}
