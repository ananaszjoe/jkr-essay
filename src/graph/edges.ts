import { MarkerType, type Edge } from "@xyflow/react";

export function makeEdge(
  id: string,
  source: string,
  target: string,
  kind: "theme" | "section" | "claim",
  highlighted = false
): Edge {
  const defaultColor = kind === "claim" ? "#89765f" : kind === "section" ? "#8879ae" : "#b6aa98";
  const color = highlighted ? "#3457d5" : defaultColor;
  return {
    id,
    source,
    target,
    type: "smoothstep",
    animated: highlighted,
    className: highlighted ? "path-edge is-highlighted" : "path-edge",
    zIndex: highlighted ? 10 : 0,
    style: { stroke: color, strokeWidth: highlighted ? 3 : 1.2 },
    markerEnd: { type: MarkerType.ArrowClosed, color, width: 14, height: 14 }
  };
}
