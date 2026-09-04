import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  type Edge,
  MiniMap,
  ReactFlow
} from "@xyflow/react";
import { claims, defaultNodeId, taxonomy } from "../app/data";
import { expandedPathForNode, nodeIdFromHash } from "../app/routing";
import { AboutDialog } from "../components/AboutDialog";
import { ClaimPanel } from "../components/ClaimPanel";
import { type GraphNode, nodeTypes } from "../components/GraphCard";
import { TopBar } from "../components/TopBar";
import type { Claim } from "../data/types";
import { useGraphElements } from "../graph/useGraphElements";
import { useGraphViewport } from "../graph/useGraphViewport";
import { useExplorationTracker } from "../hooks/useExplorationTracker";

export function GraphPage() {
  const [startingNodeId] = useState(() => nodeIdFromHash() ?? defaultNodeId);
  const [expandedPath, setExpandedPath] = useState<{ themeId: string | null; sectionId: string | null }>(() => expandedPathForNode(startingNodeId));
  const activeTheme = expandedPath.themeId;
  const activeSection = expandedPath.sectionId;
  const [currentNodeId, setCurrentNodeId] = useState(startingNodeId);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(
    claims.some((claim) => claim.id === startingNodeId) ? startingNodeId : null
  );
  const [query, setQuery] = useState("");
  const [showAbout, setShowAbout] = useState(false);
  const {
    glancedPercentage,
    readPercentage,
    showStats,
    markClaimGlanced,
    markClaimRead
  } = useExplorationTracker();

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

    const claim = claims.find((candidate) => candidate.id === nodeId);
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

  useEffect(() => {
    const expectedHash = `#${encodeURIComponent(currentNodeId)}`;
    if (window.location.hash !== expectedHash) {
      window.history.pushState(null, "", expectedHash);
    }
  }, [currentNodeId]);

  useEffect(() => {
    const selectHashNode = () => {
      const nodeId = nodeIdFromHash();
      if (nodeId && nodeId !== currentNodeId) selectNode(nodeId);
    };

    window.addEventListener("hashchange", selectHashNode);
    window.addEventListener("popstate", selectHashNode);
    return () => {
      window.removeEventListener("hashchange", selectHashNode);
      window.removeEventListener("popstate", selectHashNode);
    };
  }, [currentNodeId, selectNode]);

  const childrenForNode = useCallback((nodeId: string): string[] => {
    if (nodeId === "essay") return taxonomy.themes.map((theme) => theme.id);
    const theme = taxonomy.themes.find((candidate) => candidate.id === nodeId);
    if (theme) return taxonomy.sections.filter((section) => section.themeId === theme.id).map((section) => section.id);
    const section = taxonomy.sections.find((candidate) => candidate.id === nodeId);
    if (section) return claims.filter((claim) => claim.sectionId === section.id).map((claim) => claim.id);
    return [];
  }, []);

  const parentForNode = useCallback((nodeId: string): string | null => {
    if (nodeId === "essay") return null;
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

  const { nodes, edges } = useGraphElements({
    activeSection,
    activeTheme,
    currentNodeId,
    selectedClaimId,
    sections,
    selectNode,
    openTheme,
    openSection,
    openClaim
  });

  const {
    flowRef,
    focusCurrentNode,
    showTakeMeBack,
    updateSelectedNodeVisibility
  } = useGraphViewport({ nodes, currentNodeId, selectedClaimId });

  return (
    <main className="app-shell">
      <TopBar
        glancedPercentage={glancedPercentage}
        readPercentage={readPercentage}
        showStats={showStats}
        query={query}
        searchResults={searchResults}
        onQueryChange={setQuery}
        onOpenClaim={openClaim}
        onOpenAbout={() => setShowAbout(true)}
      />

      <section className="graph-shell" aria-label="Interactive claim graph">
        <ReactFlow<GraphNode, Edge>
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onInit={(instance) => {
            flowRef.current = instance;
            focusCurrentNode(0);
          }}
          minZoom={0.18}
          maxZoom={1.7}
          defaultViewport={{ x: 80, y: 340, zoom: 0.72 }}
          nodesDraggable={false}
          nodesConnectable={false}
          panOnScroll
          zoomOnPinch
          zoomOnDoubleClick={false}
          onMove={(event) => {
            if (event) updateSelectedNodeVisibility();
          }}
          onMoveEnd={(event) => {
            if (event) updateSelectedNodeVisibility();
          }}
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

        {showTakeMeBack && (
          <button
            className={`take-me-back ${selectedClaim ? "has-panel" : ""}`}
            type="button"
            onClick={() => focusCurrentNode()}
          >
            Take me back
          </button>
        )}
      </section>

      {selectedClaim && (
        <ClaimPanel
          key={selectedClaim.id}
          claim={selectedClaim}
          onClose={() => selectNode(selectedClaim.sectionId)}
          onGlanced={markClaimGlanced}
          onRead={markClaimRead}
        />
      )}

      {showAbout && (
        <AboutDialog onClose={() => setShowAbout(false)} />
      )}
    </main>
  );
}
