import { claims, taxonomy } from "./data";

export function nodeIdFromHash(): string | null {
  if (typeof window === "undefined" || !window.location.hash) return null;
  let nodeId: string;
  try {
    nodeId = decodeURIComponent(window.location.hash.slice(1));
  } catch {
    return null;
  }

  if (nodeId === "essay") return nodeId;
  if (taxonomy.themes.some((theme) => theme.id === nodeId)) return nodeId;
  if (taxonomy.sections.some((section) => section.id === nodeId)) return nodeId;
  if (claims.some((claim) => claim.id === nodeId)) return nodeId;
  return null;
}

export function urlForNode(nodeId: string): string {
  const url = new URL(window.location.href);
  url.hash = encodeURIComponent(nodeId);
  return url.toString();
}

export function expandedPathForNode(nodeId: string): { themeId: string | null; sectionId: string | null } {
  const claim = claims.find((candidate) => candidate.id === nodeId);
  const section = taxonomy.sections.find((candidate) => candidate.id === (claim?.sectionId ?? nodeId));
  if (section) return { themeId: section.themeId, sectionId: section.id };
  if (taxonomy.themes.some((theme) => theme.id === nodeId)) return { themeId: nodeId, sectionId: null };
  return { themeId: null, sectionId: null };
}

export function pathForNode(nodeId: string): string[] {
  if (nodeId === "essay") return ["essay"];
  const claim = claims.find((candidate) => candidate.id === nodeId);
  if (claim) {
    const section = taxonomy.sections.find((candidate) => candidate.id === claim.sectionId);
    return ["essay", section?.themeId, section?.id, claim.id].filter((id): id is string => Boolean(id));
  }
  const section = taxonomy.sections.find((candidate) => candidate.id === nodeId);
  if (section) return ["essay", section.themeId, section.id];
  if (taxonomy.themes.some((theme) => theme.id === nodeId)) return ["essay", nodeId];
  return [];
}
