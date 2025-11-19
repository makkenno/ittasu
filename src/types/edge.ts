export interface TaskEdge {
  id: string;
  source: string;
  target: string;
  parentId: string | null;
}
