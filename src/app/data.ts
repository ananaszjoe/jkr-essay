import claimsData from "../../data/claims.json";
import essayData from "../../data/essay-index.json";
import sourcesData from "../../data/sources.json";
import taxonomyData from "../../data/taxonomy.json";
import type { Claim, EssayIndex, Source, Taxonomy } from "../data/types";

export const claims = claimsData as Claim[];
export const essayIndex = essayData as EssayIndex;
export const sources = sourcesData as Source[];
export const taxonomy = taxonomyData as Taxonomy;

const initialThemeId = taxonomy.themes[0]?.id ?? null;
const initialSectionId = taxonomy.sections.find((section) => section.themeId === initialThemeId)?.id ?? null;

export const defaultNodeId = initialSectionId ?? initialThemeId ?? "essay";
