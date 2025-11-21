import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useTaskStore } from "../../stores/task-store";
import { GraphArea } from "../organisms/graph-area";
import { Header } from "../organisms/header";
import { MemoArea } from "../organisms/memo-area";

export function TaskDetailPage() {
  const currentTaskId = useTaskStore((state) => state.currentTaskId);
  const nodes = useTaskStore((state) => state.nodes);
  const edges = useTaskStore((state) => state.edges);
  const selectedTaskId = useTaskStore((state) => state.selectedTaskId);
  const updateTaskTitle = useTaskStore((state) => state.updateTaskTitle);
  const updateTaskMemo = useTaskStore((state) => state.updateTaskMemo);
  const toggleTaskComplete = useTaskStore((state) => state.toggleTaskComplete);
  const updateTaskPosition = useTaskStore((state) => state.updateTaskPosition);
  const setCurrentTaskId = useTaskStore((state) => state.setCurrentTaskId);
  const goToParent = useTaskStore((state) => state.goToParent);
  const goToNextTask = useTaskStore((state) => state.goToNextTask);
  const addChildTask = useTaskStore((state) => state.addChildTask);
  const addEdge = useTaskStore((state) => state.addEdge);
  const removeEdge = useTaskStore((state) => state.removeEdge);
  const removeTask = useTaskStore((state) => state.removeTask);
  const generateMarkdown = useTaskStore((state) => state.generateMarkdown);
  const selectTask = useTaskStore((state) => state.selectTask);

  // 現在のタスクを取得
  const currentTask = currentTaskId
    ? nodes.find((node) => node.id === currentTaskId)
    : null;
  const currentNodes = nodes.filter((node) => node.parentId === currentTaskId);
  const currentEdges = edges.filter((edge) => edge.parentId === currentTaskId);

  const isRoot = currentTaskId === null;
  const hasParent = !isRoot;

  const title = currentTask?.title || "無題";
  const completed = currentTask?.completed ?? false;
  const memo = currentTask?.memo ?? "";

  const selectedTask = nodes.find((n) => n.id === selectedTaskId) ?? null;

  const handleTitleChange = (newTitle: string) => {
    if (currentTaskId) {
      updateTaskTitle(currentTaskId, newTitle);
    }
  };

  const handleToggleComplete = () => {
    if (currentTaskId) {
      toggleTaskComplete(currentTaskId);
    }
  };

  const handleBackClick = () => {
    goToParent();
  };

  const handleNextTaskClick = () => {
    goToNextTask();
  };

  const handleNodeClick = (taskId: string) => {
    selectTask(taskId);
  };

  const handleNodeDoubleClick = (taskId: string) => {
    setCurrentTaskId(taskId);
  };

  const handleToggleCompleteNode = (taskId: string) => {
    toggleTaskComplete(taskId);
  };

  const handleNodeTitleChange = (taskId: string, newTitle: string) => {
    updateTaskTitle(taskId, newTitle);
  };

  const handleAddTask = (position?: { x: number; y: number }) => {
    addChildTask(position);
  };

  const handleMemoChange = (newMemo: string) => {
    if (currentTaskId) {
      updateTaskMemo(currentTaskId, newMemo);
    }
  };

  const handleNodesChange = (updatedNodes: typeof currentNodes) => {
    for (const node of updatedNodes) {
      const originalNode = currentNodes.find((n) => n.id === node.id);
      if (
        originalNode &&
        (originalNode.position.x !== node.position.x ||
          originalNode.position.y !== node.position.y)
      ) {
        updateTaskPosition(node.id, node.position);
      }
    }
  };

  const handleCopyMarkdown = async () => {
    const markdown = generateMarkdown(currentTaskId);
    try {
      await navigator.clipboard.writeText(markdown);
    } catch (error) {
      console.error("Failed to copy markdown:", error);
    }
  };

  const handleCopyMemo = async () => {
    if (!currentTaskId) return;

    const task = nodes.find((node) => node.id === currentTaskId);
    if (!task) return;

    const memoMarkdown = `# ${task.title}\n\n${task.memo}`;
    try {
      await navigator.clipboard.writeText(memoMarkdown);
    } catch (error) {
      console.error("Failed to copy memo:", error);
    }
  };

  const handlePaneClick = () => {
    selectTask(null);
  };

  return (
    <div className="flex flex-col h-[100dvh]">
      {!isRoot && (
        <Header
          title={title}
          completed={completed}
          hasParent={hasParent}
          onTitleChange={handleTitleChange}
          onToggleComplete={handleToggleComplete}
          onBackClick={handleBackClick}
          onNextTaskClick={handleNextTaskClick}
          onCopyMarkdown={handleCopyMarkdown}
        />
      )}

      {isRoot ? (
        <div className="flex-1 min-h-0">
          <GraphArea
            nodes={currentNodes}
            edges={currentEdges}
            selectedTask={selectedTask}
            onNodesChange={handleNodesChange}
            onNodeClick={handleNodeClick}
            onNodeDoubleClick={handleNodeDoubleClick}
            onToggleComplete={handleToggleCompleteNode}
            onTitleChange={handleNodeTitleChange}
            onAddTask={handleAddTask}
            onAddEdge={addEdge}
            onRemoveEdge={removeEdge}
            onRemoveTask={removeTask}
            onPaneClick={handlePaneClick}
          />
        </div>
      ) : (
        <div className="flex-1 min-h-0">
          <PanelGroup direction="vertical">
            <Panel defaultSize={60} minSize={30}>
              <GraphArea
                nodes={currentNodes}
                edges={currentEdges}
                selectedTask={selectedTask}
                onNodesChange={handleNodesChange}
                onNodeClick={handleNodeClick}
                onNodeDoubleClick={handleNodeDoubleClick}
                onToggleComplete={handleToggleCompleteNode}
                onTitleChange={handleNodeTitleChange}
                onAddTask={handleAddTask}
                onAddEdge={addEdge}
                onRemoveEdge={removeEdge}
                onRemoveTask={removeTask}
                onPaneClick={handlePaneClick}
              />
            </Panel>
            <PanelResizeHandle className="h-2 bg-gray-200 hover:bg-blue-400 transition-colors cursor-row-resize flex items-center justify-center">
              <div className="w-12 h-1 bg-gray-400 rounded-full" />
            </PanelResizeHandle>
            <Panel defaultSize={40} minSize={20}>
              <MemoArea
                memo={memo}
                onMemoChange={handleMemoChange}
                onCopyMemo={handleCopyMemo}
              />
            </Panel>
          </PanelGroup>
        </div>
      )}
    </div>
  );
}
