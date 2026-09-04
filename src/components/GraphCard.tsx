import { Handle, type Node, type NodeProps, Position } from "@xyflow/react";
import type { Verdict } from "../data/types";
import { VerdictBadge } from "./VerdictBadge";

export type GraphNodeData = {
  kind: "essay" | "theme" | "section" | "claim";
  eyebrow: string;
  title: string;
  meta?: string;
  verdict?: Verdict;
  active?: boolean;
  selected?: boolean;
  ancestor?: boolean;
  onOpen?: () => void;
};

export type GraphNode = Node<GraphNodeData>;

export const nodeTypes = { graphCard: GraphCard };

export function GraphCard({ data }: NodeProps<GraphNode>) {
  const interactive = Boolean(data.onOpen);
  const content = <GraphCardContent data={data} />;

  return (
    <div className={graphCardClassName(data)}>
      {data.kind !== "essay" && <Handle type="target" position={Position.Left} />}
      {interactive ? (
        <button
          className="nodrag nopan"
          type="button"
          onClick={data.onOpen}
          aria-label={`Open ${data.eyebrow}: ${data.title}`}
          aria-current={data.selected ? "true" : undefined}
          aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight Enter Escape Backspace"
        >
          {content}
        </button>
      ) : (
        <div className="graph-card__content">{content}</div>
      )}
      {data.kind !== "claim" && <Handle type="source" position={Position.Right} />}
    </div>
  );
}

export function StaticGraphCard({ data }: { data: GraphNodeData }) {
  return (
    <div className={graphCardClassName(data)}>
      <div className="graph-card__content"><GraphCardContent data={data} /></div>
    </div>
  );
}

function GraphCardContent({ data }: { data: GraphNodeData }) {
  return (
    <>
      <span className="node-eyebrow">{data.eyebrow}</span>
      <strong>{data.title}</strong>
      {(data.meta || data.verdict) && (
        <span className="node-footer">
          {data.verdict && <VerdictBadge verdict={data.verdict} />}
          {data.meta && <span className="node-meta">{data.meta}</span>}
        </span>
      )}
    </>
  );
}

function graphCardClassName(data: GraphNodeData): string {
  return [
    "graph-card",
    `graph-card--${data.kind}`,
    data.verdict && `graph-card--verdict-${data.verdict}`,
    data.active && "is-expanded",
    data.selected && "is-selected",
    data.ancestor && "is-ancestor"
  ].filter(Boolean).join(" ");
}
