import { useMemo } from "react";
import type { Edge } from "@xyflow/react";
import { claims, taxonomy } from "../app/data";
import { pathForNode } from "../app/routing";
import { makeEdge } from "./edges";
import type { Claim } from "../data/types";
import type { GraphNode } from "../components/GraphCard";

export type SectionWithClaims = (typeof taxonomy.sections)[number] & { claims: Claim[] };

type GraphElementsOptions = {
  activeSection: string | null;
  activeTheme: string | null;
  currentNodeId: string;
  selectedClaimId: string | null;
  sections: SectionWithClaims[];
  selectNode: (nodeId: string) => void;
  openTheme: (themeId: string) => void;
  openSection: (sectionId: string) => void;
  openClaim: (claim: Claim) => void;
};

export function useGraphElements({
  activeSection,
  activeTheme,
  currentNodeId,
  selectedClaimId,
  sections,
  selectNode,
  openTheme,
  openSection,
  openClaim
}: GraphElementsOptions): { nodes: GraphNode[]; edges: Edge[] } {
  return useMemo(() => {
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
      const claimSpacing = 144;
      const claimStartY = sectionY - ((expandedSection.claims.length - 1) * claimSpacing) / 2;

      expandedSection.claims.forEach((claim, index) => {
        const y = claimStartY + index * claimSpacing;
        nextNodes.push({
          id: claim.id,
          type: "graphCard",
          position: { x: 1110, y },
          width: 310,
          height: 116,
          data: {
            kind: "claim",
            eyebrow: `Claim ${String(claim.number).padStart(3, "0")}`,
            title: claim.statement,
            meta: selectedClaimId === claim.id ? "details open" : "open details",
            verdict: claim.factCheck?.verdict,
            active: selectedClaimId === claim.id,
            ...selectionFor(claim.id),
            onOpen: () => openClaim(claim)
          }
        });
        nextEdges.push(makeEdge(`${expandedSection.id}-${claim.id}`, expandedSection.id, claim.id, "claim", pathIsHighlighted(expandedSection.id, claim.id)));
      });
    }

    return { nodes: nextNodes, edges: nextEdges };
  }, [activeSection, activeTheme, currentNodeId, openClaim, openSection, openTheme, sections, selectNode, selectedClaimId]);
}
