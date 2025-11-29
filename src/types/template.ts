export interface TemplateTask {
  title: string;
  memo?: string;
  relativePosition: { x: number; y: number }; // Relative to the first task or center
}

export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  tasks: TemplateTask[];
  edges: { sourceIndex: number; targetIndex: number }[];
}
