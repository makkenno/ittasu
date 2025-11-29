import { useCallback, useRef, useState } from "react";
import type { ReactFlowInstance } from "reactflow";

interface SelectionOverlayProps {
  rfInstance: ReactFlowInstance;
  onSelectionChange: (selectedNodeIds: string[]) => void;
  onNodeClick?: (nodeId: string) => void;
  onPaneClick?: () => void;
  nodes: {
    id: string;
    position: { x: number; y: number };
    width?: number;
    height?: number;
  }[];
}

export function SelectionOverlay({
  rfInstance,
  onSelectionChange,
  onNodeClick,
  onPaneClick,
  nodes,
}: SelectionOverlayProps) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const autoPanRequestId = useRef<number | undefined>(undefined);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // コンテナ内での相対座標を取得
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    startPosRef.current = { x, y };

    setIsSelecting(true);
    setSelectionBox({
      startX: x,
      startY: y,
      currentX: x,
      currentY: y,
    });
    container.setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isSelecting || !selectionBox) return;

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setSelectionBox((prev) =>
        prev ? { ...prev, currentX: x, currentY: y } : null,
      );

      // Auto-panning logic
      const edgeThreshold = 50;
      const panSpeed = 5;
      const clientX = e.clientX;
      const clientY = e.clientY;
      const { innerWidth, innerHeight } = window;

      const panX =
        clientX < edgeThreshold
          ? panSpeed
          : clientX > innerWidth - edgeThreshold
            ? -panSpeed
            : 0;
      const panY =
        clientY < edgeThreshold
          ? panSpeed
          : clientY > innerHeight - edgeThreshold
            ? -panSpeed
            : 0;

      if (panX !== 0 || panY !== 0) {
        if (!autoPanRequestId.current) {
          const loop = () => {
            const { x: viewportX, y: viewportY, zoom } = rfInstance.getViewport();
            rfInstance.setViewport({
              x: viewportX + panX,
              y: viewportY + panY,
              zoom,
            });
            autoPanRequestId.current = requestAnimationFrame(loop);
          };
          loop();
        }
      } else {
        if (autoPanRequestId.current) {
          cancelAnimationFrame(autoPanRequestId.current);
          autoPanRequestId.current = undefined;
        }
      }
    },
    [isSelecting, selectionBox, rfInstance],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (autoPanRequestId.current) {
        cancelAnimationFrame(autoPanRequestId.current);
        autoPanRequestId.current = undefined;
      }

      if (!isSelecting || !selectionBox || !startPosRef.current) return;

      const container = containerRef.current;
      if (container) {
        container.releasePointerCapture(e.pointerId);

        const rect = container.getBoundingClientRect();
        const endX = e.clientX - rect.left;
        const endY = e.clientY - rect.top;

        const dist = Math.sqrt(
          Math.pow(endX - startPosRef.current.x, 2) +
            Math.pow(endY - startPosRef.current.y, 2),
        );

        // クリック判定 (移動距離が小さい場合)
        if (dist < 5) {
          e.preventDefault();
          e.stopPropagation();
          // クリック位置にあるノードを探す
          // 画面座標からフロー座標へ変換
          const flowPos = rfInstance.screenToFlowPosition({
            x: e.clientX,
            y: e.clientY,
          });

          const clickedNode = nodes.find((node) => {
            const nodeWidth = node.width ?? 150;
            const nodeHeight = node.height ?? 80;

            return (
              flowPos.x >= node.position.x &&
              flowPos.x <= node.position.x + nodeWidth &&
              flowPos.y >= node.position.y &&
              flowPos.y <= node.position.y + nodeHeight
            );
          });

          if (clickedNode) {
            onNodeClick?.(clickedNode.id);
          } else {
            onPaneClick?.();
          }

          setSelectionBox(null);
          setIsSelecting(false);
          startPosRef.current = null;
          return;
        }
      }

      e.preventDefault();
      e.stopPropagation();

      // 選択範囲の計算 (ドラッグの場合)
      const x = Math.min(selectionBox.startX, selectionBox.currentX);
      const y = Math.min(selectionBox.startY, selectionBox.currentY);
      const width = Math.abs(selectionBox.currentX - selectionBox.startX);
      const height = Math.abs(selectionBox.currentY - selectionBox.startY);

      // 画面座標からReactFlow座標へ変換
      // 選択ボックスの左上と右下の座標を取得
      const startScreen = {
        x: container ? container.getBoundingClientRect().left + x : 0,
        y: container ? container.getBoundingClientRect().top + y : 0,
      };
      const endScreen = {
        x: startScreen.x + width,
        y: startScreen.y + height,
      };

      const startFlow = rfInstance.screenToFlowPosition(startScreen);
      const endFlow = rfInstance.screenToFlowPosition(endScreen);

      // 選択範囲 (フロー座標)
      const selectionRect = {
        x: Math.min(startFlow.x, endFlow.x),
        y: Math.min(startFlow.y, endFlow.y),
        width: Math.abs(endFlow.x - startFlow.x),
        height: Math.abs(endFlow.y - startFlow.y),
      };

      const selectedIds: string[] = [];

      for (const node of nodes) {
        // ここでは簡易的に幅150, 高さ50程度と仮定するか、ReactFlowの内部情報を参照したいところだが
        // propsのnodesにwidth/heightが含まれていることを期待する
        // もし含まれていなければデフォルトサイズを使用
        const nodeWidth = node.width ?? 150;
        const nodeHeight = node.height ?? 80; // TaskNodeの概算サイズ

        if (
          node.position.x < selectionRect.x + selectionRect.width &&
          node.position.x + nodeWidth > selectionRect.x &&
          node.position.y < selectionRect.y + selectionRect.height &&
          node.position.y + nodeHeight > selectionRect.y
        ) {
          selectedIds.push(node.id);
        }
      }

      onSelectionChange(selectedIds);

      setSelectionBox(null);
      setIsSelecting(false);
      startPosRef.current = null;
    },
    [
      isSelecting,
      selectionBox,
      rfInstance,
      nodes,
      onSelectionChange,
      onNodeClick,
      onPaneClick,
    ],
  );

  // 選択ボックスのスタイル計算
  const getBoxStyle = () => {
    if (!selectionBox) return {};
    const left = Math.min(selectionBox.startX, selectionBox.currentX);
    const top = Math.min(selectionBox.startY, selectionBox.currentY);
    const width = Math.abs(selectionBox.currentX - selectionBox.startX);
    const height = Math.abs(selectionBox.currentY - selectionBox.startY);

    return {
      left,
      top,
      width,
      height,
    };
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-50 touch-none cursor-crosshair"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp} // 画面外に出た場合も終了扱い
    >
      {isSelecting && selectionBox && (
        <div
          className="absolute border-2 border-blue-500 bg-blue-200/30 pointer-events-none"
          style={getBoxStyle()}
        />
      )}
    </div>
  );
}
