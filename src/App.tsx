import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  Edge,
  Handle,
  MarkerType,
  MiniMap,
  Node,
  NodeProps,
  Position,
  ReactFlow,
  ReactFlowInstance
} from "@xyflow/react";
import claimsData from "../data/claims.json";
import essayData from "../data/essay-index.json";
import taxonomyData from "../data/taxonomy.json";
import type { Claim, EssayIndex, Taxonomy } from "./data/types";

const claims = claimsData as Claim[];
const essayIndex = essayData as EssayIndex;
const taxonomy = taxonomyData as Taxonomy;
const initialThemeId = taxonomy.themes[0]?.id ?? null;
const initialSectionId = taxonomy.sections.find((section) => section.themeId === initialThemeId)?.id ?? null;

type GraphNodeData = {
  kind: "essay" | "theme" | "section" | "claim" | "factcheck";
  eyebrow: string;
  title: string;
  meta?: string;
  active?: boolean;
  selected?: boolean;
  ancestor?: boolean;
  onOpen?: () => void;
};

type GraphNode = Node<GraphNodeData>;

const nodeTypes = { graphCard: GraphCard };

function GraphCard({ data }: NodeProps<GraphNode>) {
  const interactive = Boolean(data.onOpen);
  const content = (
    <>
      <span className="node-eyebrow">{data.eyebrow}</span>
      <strong>{data.title}</strong>
      {data.meta && <span className="node-meta">{data.meta}</span>}
    </>
  );

  return (
    <div className={`graph-card graph-card--${data.kind} ${data.active ? "is-expanded" : ""} ${data.selected ? "is-selected" : ""} ${data.ancestor ? "is-ancestor" : ""}`}>
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
      {data.kind !== "factcheck" && (
        <Handle type="source" position={Position.Right} />
      )}
    </div>
  );
}

function App() {
  const [expandedPath, setExpandedPath] = useState<{ themeId: string | null; sectionId: string | null }>({
    themeId: initialThemeId,
    sectionId: initialSectionId
  });
  const activeTheme = expandedPath.themeId;
  const activeSection = expandedPath.sectionId;
  const [currentNodeId, setCurrentNodeId] = useState(initialSectionId ?? initialThemeId ?? "essay");
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [showAbout, setShowAbout] = useState(false);
  const flowRef = useRef<ReactFlowInstance<GraphNode, Edge> | null>(null);

  const sections = useMemo(() => taxonomy.sections.map((section) => ({
    ...section,
    claims: claims.filter((claim) => claim.sectionId === section.id)
  })), []);

  const selectedClaim = useMemo(
    () => claims.find((claim) => claim.id === selectedClaimId) ?? null,
    [selectedClaimId]
  );

  const searchResults = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (needle.length < 2) return [];
    return claims.filter((claim) => claim.statement.toLocaleLowerCase().includes(needle)).slice(0, 8);
  }, [query]);

  const selectNode = useCallback((nodeId: string) => {
    setCurrentNodeId(nodeId);

    if (nodeId === "essay") {
      setSelectedClaimId(null);
      return;
    }

    const theme = taxonomy.themes.find((candidate) => candidate.id === nodeId);
    if (theme) {
      setExpandedPath((current) => {
        if (current.themeId === theme.id) return current;
        const firstSection = taxonomy.sections.find((section) => section.themeId === theme.id);
        return { themeId: theme.id, sectionId: firstSection?.id ?? null };
      });
      setSelectedClaimId(null);
      return;
    }

    const section = taxonomy.sections.find((candidate) => candidate.id === nodeId);
    if (section) {
      setExpandedPath({ themeId: section.themeId, sectionId: section.id });
      setSelectedClaimId(null);
      return;
    }

    const claimId = nodeId.endsWith("-factcheck") ? nodeId.slice(0, -"-factcheck".length) : nodeId;
    const claim = claims.find((candidate) => candidate.id === claimId);
    if (!claim) return;
    const claimSection = taxonomy.sections.find((candidate) => candidate.id === claim.sectionId);
    if (!claimSection) return;
    setExpandedPath({ themeId: claimSection.themeId, sectionId: claimSection.id });
    setSelectedClaimId(claim.id);
    setQuery("");
  }, []);

  const openTheme = useCallback((themeId: string) => {
    const firstSection = taxonomy.sections.find((section) => section.themeId === themeId);
    setExpandedPath((current) => current.themeId === themeId
      ? { themeId: null, sectionId: null }
      : { themeId, sectionId: firstSection?.id ?? null });
    setCurrentNodeId(themeId);
    setSelectedClaimId(null);
  }, []);

  const openSection = useCallback((sectionId: string) => {
    const section = taxonomy.sections.find((candidate) => candidate.id === sectionId);
    if (!section) return;
    setExpandedPath((current) => ({
      themeId: section.themeId,
      sectionId: current.sectionId === sectionId ? null : sectionId
    }));
    setCurrentNodeId(sectionId);
    setSelectedClaimId(null);
  }, []);

  const openClaim = useCallback((claim: Claim) => {
    selectNode(claim.id);
  }, [selectNode]);

  const childrenForNode = useCallback((nodeId: string): string[] => {
    if (nodeId === "essay") return taxonomy.themes.map((theme) => theme.id);
    const theme = taxonomy.themes.find((candidate) => candidate.id === nodeId);
    if (theme) return taxonomy.sections.filter((section) => section.themeId === theme.id).map((section) => section.id);
    const section = taxonomy.sections.find((candidate) => candidate.id === nodeId);
    if (section) return claims.filter((claim) => claim.sectionId === section.id).map((claim) => claim.id);
    if (claims.some((claim) => claim.id === nodeId)) return [`${nodeId}-factcheck`];
    return [];
  }, []);

  const parentForNode = useCallback((nodeId: string): string | null => {
    if (nodeId === "essay") return null;
    if (nodeId.endsWith("-factcheck")) return nodeId.slice(0, -"-factcheck".length);
    const claim = claims.find((candidate) => candidate.id === nodeId);
    if (claim) return claim.sectionId;
    const section = taxonomy.sections.find((candidate) => candidate.id === nodeId);
    if (section) return section.themeId;
    if (taxonomy.themes.some((theme) => theme.id === nodeId)) return "essay";
    return null;
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (showAbout) return;
      const target = event.target as HTMLElement | null;
      const isGraphControl = Boolean(target?.closest(".graph-card"));
      if (target?.matches("input, textarea, select, [contenteditable='true']")) return;
      if (!isGraphControl && target?.closest("button, a")) return;

      const parentId = parentForNode(currentNodeId);
      const siblings = parentId ? childrenForNode(parentId) : ["essay"];
      const siblingIndex = siblings.indexOf(currentNodeId);
      let destination: string | null = null;

      if (event.key === "ArrowUp" && siblingIndex !== -1) {
        destination = siblings[(siblingIndex - 1 + siblings.length) % siblings.length];
      } else if (event.key === "ArrowDown" && siblingIndex !== -1) {
        destination = siblings[(siblingIndex + 1) % siblings.length];
      } else if (["ArrowLeft", "Escape", "Backspace"].includes(event.key)) {
        destination = parentId;
      } else if (["ArrowRight", "Enter"].includes(event.key)) {
        destination = childrenForNode(currentNodeId)[0] ?? null;
      } else {
        return;
      }

      if (!destination) return;
      event.preventDefault();
      event.stopPropagation();
      selectNode(destination);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [childrenForNode, currentNodeId, parentForNode, selectNode, showAbout]);

  const { nodes, edges } = useMemo(() => {
    const nextNodes: GraphNode[] = [];
    const nextEdges: Edge[] = [];
    const selectedPath = new Set(pathForNode(currentNodeId));
    const selectionFor = (nodeId: string) => ({
      selected: nodeId === currentNodeId,
      ancestor: nodeId !== currentNodeId && selectedPath.has(nodeId)
    });
    const pathIsHighlighted = (source: string, target: string) => selectedPath.has(source) && selectedPath.has(target);
    const themeSpacing = 170;
    const firstThemeY = -((taxonomy.themes.length - 1) * themeSpacing) / 2;

    nextNodes.push({
      id: "essay",
      type: "graphCard",
      position: { x: 0, y: -62 },
      width: 330,
      height: 126,
      data: {
        kind: "essay",
        eyebrow: "June 2020 essay",
        title: "J.K. Rowling Writes about Her Reasons for Speaking out on Sex and Gender Issues",
        meta: `${claims.length} extracted claims`,
        ...selectionFor("essay"),
        onOpen: () => selectNode("essay")
      }
    });

    taxonomy.themes.forEach((theme, index) => {
      const y = firstThemeY + index * themeSpacing;
      const themeSections = sections.filter((section) => section.themeId === theme.id);
      const themeClaims = themeSections.reduce((total, section) => total + section.claims.length, 0);
      nextNodes.push({
        id: theme.id,
        type: "graphCard",
        position: { x: 390, y },
        width: 280,
        height: 86,
        data: {
          kind: "theme",
          eyebrow: `Theme ${String(index + 1).padStart(2, "0")}`,
          title: theme.title,
          meta: `${themeSections.length} sections · ${themeClaims} claims`,
          active: activeTheme === theme.id,
          ...selectionFor(theme.id),
          onOpen: () => openTheme(theme.id)
        }
      });
      nextEdges.push(makeEdge(`essay-${theme.id}`, "essay", theme.id, "theme", pathIsHighlighted("essay", theme.id)));
    });

    const expandedTheme = taxonomy.themes.find((theme) => theme.id === activeTheme);
    const themeSections = sections.filter((section) => section.themeId === activeTheme);
    if (expandedTheme) {
      const themeIndex = taxonomy.themes.findIndex((theme) => theme.id === activeTheme);
      const themeY = firstThemeY + themeIndex * themeSpacing;
      const sectionSpacing = 132;
      const sectionStartY = themeY - ((themeSections.length - 1) * sectionSpacing) / 2;

      themeSections.forEach((section, index) => {
        const y = sectionStartY + index * sectionSpacing;
        nextNodes.push({
          id: section.id,
          type: "graphCard",
          position: { x: 750, y },
          width: 280,
          height: 86,
          data: {
            kind: "section",
            eyebrow: `Section ${String(index + 1).padStart(2, "0")}`,
            title: section.title,
            meta: `${section.claims.length} claims · ${activeSection === section.id ? "collapse" : "expand"}`,
            active: activeSection === section.id,
            ...selectionFor(section.id),
            onOpen: () => openSection(section.id)
          }
        });
        nextEdges.push(makeEdge(`${expandedTheme.id}-${section.id}`, expandedTheme.id, section.id, "section", pathIsHighlighted(expandedTheme.id, section.id)));
      });
    }

    const expandedSection = sections.find((section) => section.id === activeSection);
    if (expandedSection) {
      const sectionNode = nextNodes.find((node) => node.id === expandedSection.id);
      const sectionY = sectionNode?.position.y ?? 0;
      const claimSpacing = 112;
      const claimStartY = sectionY - ((expandedSection.claims.length - 1) * claimSpacing) / 2;

      expandedSection.claims.forEach((claim, index) => {
        const y = claimStartY + index * claimSpacing;
        nextNodes.push({
          id: claim.id,
          type: "graphCard",
          position: { x: 1110, y },
          width: 310,
          height: 86,
          data: {
            kind: "claim",
            eyebrow: `Claim ${String(claim.number).padStart(3, "0")}`,
            title: claim.statement,
            meta: selectedClaimId === claim.id ? "details open" : "open details",
            active: selectedClaimId === claim.id,
            ...selectionFor(claim.id),
            onOpen: () => openClaim(claim)
          }
        });
        nextEdges.push(makeEdge(`${expandedSection.id}-${claim.id}`, expandedSection.id, claim.id, "claim", pathIsHighlighted(expandedSection.id, claim.id)));
      });
    }

    if (selectedClaim) {
      const claimNode = nextNodes.find((node) => node.id === selectedClaim.id);
      const baseY = claimNode?.position.y ?? 0;
      const paragraphLabel = selectedClaim.reference.paragraphIds.join(", ").toUpperCase();
      const evidenceCount = selectedClaim.factCheck?.evidence?.length ?? 0;
      const factCheckNodeId = `${selectedClaim.id}-factcheck`;
      nextNodes.push({
        id: factCheckNodeId,
        type: "graphCard",
        position: { x: 1510, y: baseY },
        width: 280,
        height: 86,
        data: {
          kind: "factcheck",
          eyebrow: "Fact-check record",
          title: selectedClaim.factCheck?.verdict ?? "Pending assessment",
          meta: `${paragraphLabel} · ${evidenceCount ? `${evidenceCount} evidence items` : "no evidence yet"}`,
          ...selectionFor(factCheckNodeId),
          onOpen: () => selectNode(factCheckNodeId)
        }
      });
      nextEdges.push(makeEdge(`${selectedClaim.id}-${factCheckNodeId}`, selectedClaim.id, factCheckNodeId, "detail", pathIsHighlighted(selectedClaim.id, factCheckNodeId)));
    }

    return { nodes: nextNodes, edges: nextEdges };
  }, [activeSection, activeTheme, currentNodeId, openClaim, openSection, openTheme, sections, selectNode, selectedClaim, selectedClaimId]);

  useEffect(() => {
    if (!flowRef.current) return;
    const node = nodes.find((candidate) => candidate.id === currentNodeId);
    if (!node) return;
    const view = {
      essay: { offset: 200, zoom: 0.72 },
      theme: { offset: 250, zoom: 0.76 },
      section: { offset: 280, zoom: 0.68 },
      claim: { offset: 320, zoom: 0.8 },
      factcheck: { offset: -100, zoom: 0.8 }
    }[node.data.kind];
    window.setTimeout(() => {
      flowRef.current?.setCenter(node.position.x + view.offset, node.position.y + (node.height ?? 86) / 2, {
        zoom: view.zoom,
        duration: 350
      });
    }, 30);
  }, [currentNodeId, nodes]);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="search-wrap">
          <label htmlFor="claim-search">Search all claims</label>
          <input
            id="claim-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search 247 claims…"
            autoComplete="off"
          />
          {query.trim().length >= 2 && (
            <div className="search-results" role="listbox" aria-label="Matching claims">
              {searchResults.length ? searchResults.map((claim) => (
                <button key={claim.id} type="button" onClick={() => openClaim(claim)} role="option">
                  <span>{String(claim.number).padStart(3, "0")}</span>
                  {claim.statement}
                </button>
              )) : <p>No matching claims</p>}
            </div>
          )}
        </div>

        <button className="about-button" type="button" onClick={() => setShowAbout(true)}>
          About
        </button>
      </header>

      <section className="graph-shell" aria-label="Interactive claim graph">
        <ReactFlow<GraphNode, Edge>
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onInit={(instance) => { flowRef.current = instance; }}
          minZoom={0.18}
          maxZoom={1.7}
          defaultViewport={{ x: 80, y: 340, zoom: 0.72 }}
          nodesDraggable={false}
          nodesConnectable={false}
          panOnScroll
          zoomOnPinch
          zoomOnDoubleClick={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={22} size={1.2} color="#c9c4b8" />
          <Controls showInteractive={false} position="bottom-left" />
          <MiniMap
            position="bottom-right"
            pannable
            zoomable
            nodeColor={(node) => node.data?.kind === "claim" ? "#3457d5" : node.data?.kind === "theme" ? "#5d4c87" : "#9b8870"}
            maskColor="rgba(243, 240, 232, 0.78)"
          />
        </ReactFlow>

        <div className="graph-hint">
          <span aria-hidden="true">↔</span>
          Pan · zoom · arrow keys navigate
        </div>
      </section>

      {selectedClaim && (
        <ClaimPanel claim={selectedClaim} onClose={() => setSelectedClaimId(null)} />
      )}

      {showAbout && (
        <AboutDialog onClose={() => setShowAbout(false)} />
      )}
    </main>
  );
}

function ClaimPanel({ claim, onClose }: { claim: Claim; onClose: () => void }) {
  const section = taxonomy.sections.find((candidate) => candidate.id === claim.sectionId);
  const theme = taxonomy.themes.find((candidate) => candidate.id === section?.themeId);
  const paragraphs = claim.reference.paragraphIds
    .map((id) => essayIndex.paragraphs.find((paragraph) => paragraph.id === id))
    .filter((paragraph): paragraph is EssayIndex["paragraphs"][number] => Boolean(paragraph));

  return (
    <aside className="claim-panel" aria-label={`Claim ${claim.number} details`}>
      <div className="panel-grab" aria-hidden="true" />
      <div className="panel-heading">
        <span>Claim {String(claim.number).padStart(3, "0")}</span>
        <button type="button" onClick={onClose} aria-label="Close claim details">×</button>
      </div>
      <h1>{claim.statement}</h1>
      <p className="panel-section">{theme?.title} / {section?.title}</p>

      <section>
        <h2>In the essay</h2>
        {paragraphs.map((paragraph) => (
          <article className="reference-card" key={paragraph.id}>
            <strong>{paragraph.id.toUpperCase()}</strong>
            <p>{paragraph.summary}</p>
          </article>
        ))}
        <a href={essayIndex.essay.url} target="_blank" rel="noreferrer">Read the original essay ↗</a>
      </section>

      <section>
        <h2>Fact-check</h2>
        {claim.factCheck ? (
          <>
            <span className="status-pill">{claim.factCheck.verdict ?? claim.factCheck.status}</span>
            {claim.factCheck.summary && <p>{claim.factCheck.summary}</p>}
            {claim.factCheck.analysis && <p>{claim.factCheck.analysis}</p>}
          </>
        ) : (
          <div className="empty-state">
            <span>Pending research</span>
            <p>Evidence, analysis and a verdict will appear here as this project develops.</p>
          </div>
        )}
      </section>
    </aside>
  );
}

function AboutDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="about-dialog" role="dialog" aria-modal="true" aria-labelledby="about-title" onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" className="dialog-close" onClick={onClose} aria-label="Close about dialog">×</button>
        <span className="kicker">About this project</span>
        <h1 id="about-title">One essay. 247 separable claims.</h1>
        <p>This project maps the externally checkable claims extracted from J.K. Rowling's June 2020 essay. It separates what was said, where it appears, what the available evidence shows, and how confidently a conclusion can be drawn.</p>
        <p>The dataset and interface are still being developed. A pending result means the claim has been indexed but not yet assessed.</p>
      </section>
    </div>
  );
}

function pathForNode(nodeId: string): string[] {
  if (nodeId === "essay") return ["essay"];
  const factCheckClaimId = nodeId.endsWith("-factcheck") ? nodeId.slice(0, -"-factcheck".length) : null;
  const claim = claims.find((candidate) => candidate.id === (factCheckClaimId ?? nodeId));
  if (claim) {
    const section = taxonomy.sections.find((candidate) => candidate.id === claim.sectionId);
    return ["essay", section?.themeId, section?.id, claim.id, factCheckClaimId ? nodeId : undefined]
      .filter((id): id is string => Boolean(id));
  }
  const section = taxonomy.sections.find((candidate) => candidate.id === nodeId);
  if (section) return ["essay", section.themeId, section.id];
  if (taxonomy.themes.some((theme) => theme.id === nodeId)) return ["essay", nodeId];
  return [];
}

function makeEdge(id: string, source: string, target: string, kind: "theme" | "section" | "claim" | "detail", highlighted = false): Edge {
  const defaultColor = kind === "detail" ? "#3457d5" : kind === "claim" ? "#89765f" : kind === "section" ? "#8879ae" : "#b6aa98";
  const color = highlighted ? "#3457d5" : defaultColor;
  return {
    id,
    source,
    target,
    type: "smoothstep",
    animated: highlighted,
    className: highlighted ? "path-edge is-highlighted" : "path-edge",
    zIndex: highlighted ? 10 : 0,
    style: { stroke: color, strokeWidth: highlighted ? 3 : kind === "detail" ? 1.8 : 1.2 },
    markerEnd: { type: MarkerType.ArrowClosed, color, width: 14, height: 14 }
  };
}

export default App;
