import { useCallback, useEffect, useRef, useState } from "react";
import type { Edge, ReactFlowInstance } from "@xyflow/react";
import type { GraphNode } from "../components/GraphCard";

export function useGraphViewport({
  nodes,
  currentNodeId,
  selectedClaimId
}: {
  nodes: GraphNode[];
  currentNodeId: string;
  selectedClaimId: string | null;
}) {
  const flowRef = useRef<ReactFlowInstance<GraphNode, Edge> | null>(null);
  const [showTakeMeBack, setShowTakeMeBack] = useState(false);

  const focusCurrentNode = useCallback((duration = 350) => {
    if (!flowRef.current) return;
    const node = nodes.find((candidate) => candidate.id === currentNodeId);
    if (!node) return;
    const preferredView = {
      essay: { offset: 200, zoom: 0.72 },
      theme: { offset: 250, zoom: 0.76 },
      section: { offset: 280, zoom: 0.68 },
      claim: { offset: 0, zoom: 0.8 }
    }[node.data.kind];

    setShowTakeMeBack(false);
    const frame = window.requestAnimationFrame(() => {
      const panel = document.querySelector<HTMLElement>(".claim-panel");
      const canvas = document.querySelector<HTMLElement>(".graph-shell");
      const nodeWidth = node.width ?? 280;
      const nodeHeight = node.height ?? 86;
      let centerX = node.position.x + nodeWidth / 2 + preferredView.offset;
      let centerY = node.position.y + nodeHeight / 2;
      let zoom = preferredView.zoom;

      if (panel && canvas && selectedClaimId) {
        const panelBounds = panel.getBoundingClientRect();
        const canvasBounds = canvas.getBoundingClientRect();
        const panelIsBottomSheet = panelBounds.width >= canvasBounds.width * 0.9;
        const visibleWidth = panelIsBottomSheet ? canvasBounds.width : canvasBounds.width - panelBounds.width;
        const visibleHeight = panelIsBottomSheet ? canvasBounds.height - panelBounds.height : canvasBounds.height;
        const maximumFittingZoom = Math.min((visibleWidth - 48) / nodeWidth, (visibleHeight - 48) / nodeHeight);

        zoom = Math.max(0.35, Math.min(preferredView.zoom, maximumFittingZoom));
        centerX = node.position.x + nodeWidth / 2;
        centerY = node.position.y + nodeHeight / 2;
        if (panelIsBottomSheet) centerY += panelBounds.height / (2 * zoom);
        else centerX += panelBounds.width / (2 * zoom);
      }

      const flow = flowRef.current;
      void flow?.setCenter(centerX, centerY, { zoom, duration }).then(() => {
        if (node.data.kind !== "claim") return;
        window.requestAnimationFrame(() => centerSelectedClaim(flow, node, duration));
      });
    });

    return frame;
  }, [currentNodeId, nodes, selectedClaimId]);

  useEffect(() => {
    const frame = focusCurrentNode();
    return () => {
      if (frame !== undefined) window.cancelAnimationFrame(frame);
    };
  }, [focusCurrentNode]);

  const updateSelectedNodeVisibility = useCallback(() => {
    const selectedNode = document.querySelector<HTMLElement>(".graph-card.is-selected");
    const bounds = visibleCanvasBounds();
    if (!selectedNode || !bounds) {
      setShowTakeMeBack(false);
      return;
    }

    const nodeBounds = selectedNode.getBoundingClientRect();
    const isVisible = nodeBounds.right > bounds.left
      && nodeBounds.left < bounds.right
      && nodeBounds.bottom > bounds.top
      && nodeBounds.top < bounds.bottom;
    setShowTakeMeBack(!isVisible);
  }, []);

  return { flowRef, focusCurrentNode, showTakeMeBack, updateSelectedNodeVisibility };
}

function centerSelectedClaim(flow: ReactFlowInstance<GraphNode, Edge>, node: GraphNode, duration: number) {
  const selectedNode = document.querySelector<HTMLElement>(".graph-card.is-selected");
  const selectedWrapper = selectedNode?.closest<HTMLElement>(".react-flow__node");
  const bounds = visibleCanvasBounds();
  if (!selectedNode || !bounds || selectedWrapper?.dataset.id !== node.id) return;

  const nodeBounds = selectedNode.getBoundingClientRect();
  const desiredX = (bounds.left + bounds.right) / 2;
  const desiredY = (bounds.top + bounds.bottom) / 2;
  const actualX = nodeBounds.left + nodeBounds.width / 2;
  const actualY = nodeBounds.top + nodeBounds.height / 2;
  const viewport = flow.getViewport();
  const deltaX = desiredX - actualX;
  const deltaY = desiredY - actualY;

  if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
    void flow.setViewport({ x: viewport.x + deltaX, y: viewport.y + deltaY, zoom: viewport.zoom }, { duration: duration === 0 ? 0 : 150 });
  }
}

function visibleCanvasBounds(): { left: number; right: number; top: number; bottom: number } | null {
  const canvas = document.querySelector<HTMLElement>(".graph-shell");
  if (!canvas) return null;
  const canvasBounds = canvas.getBoundingClientRect();
  const panelBounds = document.querySelector<HTMLElement>(".claim-panel")?.getBoundingClientRect();
  let right = canvasBounds.right;
  let bottom = canvasBounds.bottom;

  if (panelBounds) {
    const panelIsBottomSheet = panelBounds.width >= canvasBounds.width * 0.9;
    if (panelIsBottomSheet) bottom = Math.min(bottom, panelBounds.top);
    else right = Math.min(right, panelBounds.left);
  }
  return { left: canvasBounds.left, right, top: canvasBounds.top, bottom };
}
