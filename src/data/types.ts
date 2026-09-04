/** Stable IDs are strings so content can be moved between files or a database. */
export type ClaimId = string;
export type SourceId = string;
export type MediaId = string;
export type ThemeId = string;
export type SectionId = string;

export interface ProjectData {
  essay: Essay;
  taxonomy: Taxonomy;
  claims: Claim[];
  sources: Source[];
  media: Media[];
}

export interface Taxonomy {
  themes: ClaimTheme[];
  sections: ClaimSection[];
}

export interface ClaimTheme {
  id: ThemeId;
  title: string;
  description: string;
}

export interface ClaimSection {
  id: SectionId;
  themeId: ThemeId;
  title: string;
}

export interface EssayIndex {
  essay: Essay;
  indexedOn: string; // ISO 8601 date: YYYY-MM-DD
  paragraphs: EssayParagraph[];
}

export interface EssayParagraph {
  id: string;
  number: number;
  selector: string;
  summary: string;
  wordCount: number;
  contentHash: string;
}

export interface Essay {
  title: string;
  author: string;
  publishedOn: string; // ISO 8601 date: YYYY-MM-DD
  url: string;
}

/**
 * The central editorial unit. The graph shown by the SPA is derived from this
 * object and its referenced sources/media; graph-library nodes are not stored.
 */
export interface Claim {
  id: ClaimId;
  number: number;
  statement: string;
  sectionId: SectionId;
  reference: ClaimReference;
  category?: ClaimCategory;
  checkability?: Checkability;
  tags?: string[];
  factCheck?: FactCheck;
  mediaIds?: MediaId[];
  relatedClaims?: RelatedClaim[];
}

/** Where and how the claim appears in Rowling's essay. */
export interface ClaimReference {
  paragraphIds: string[];
  quote?: string;
  paragraph?: number;
  context?: string;
}

export type ClaimCategory =
  | "event"
  | "quantitative"
  | "historical"
  | "legal"
  | "scientific"
  | "medical"
  | "attribution"
  | "biographical"
  | "autobiographical"
  | "causal"
  | "generalization"
  | "other";

export type Checkability = "checkable" | "partly-checkable" | "not-verifiable";

export interface FactCheck {
  status: FactCheckStatus;
  verdict?: Verdict;
  summary?: string;
  analysis?: string;
  evidence?: Evidence[];
  limitations?: string;
  updatedOn?: string; // ISO 8601 date: YYYY-MM-DD
}

export type FactCheckStatus = "not-started" | "researching" | "draft" | "reviewed" | "published";

export type Verdict =
  | "supported"
  | "mostly-supported"
  | "mixed"
  | "mostly-unsupported"
  | "unsupported"
  | "misleading-context"
  | "unverifiable";

/** A source used for this specific claim, plus its evidentiary role. */
export interface Evidence {
  sourceId: SourceId;
  stance: EvidenceStance;
  locator?: string; // Page, section, paragraph, timestamp, or URL fragment.
  quote?: string;
  note: string;
}

export type EvidenceStance = "supports" | "contradicts" | "contextualizes" | "neutral";

/** Bibliographic details live once even when a source is used by many claims. */
export interface Source {
  id: SourceId;
  title: string;
  authors?: string[];
  publisher?: string;
  publishedOn?: string; // ISO 8601 date: YYYY-MM-DD
  accessedOn: string; // ISO 8601 date: YYYY-MM-DD
  url: string;
  archiveUrl?: string;
  type: SourceType;
}

export type SourceType =
  | "original-essay"
  | "primary-document"
  | "legislation"
  | "court-decision"
  | "government-data"
  | "research"
  | "clinical-guidance"
  | "news"
  | "interview"
  | "social-media"
  | "other";

export interface Media {
  id: MediaId;
  type: "image" | "video" | "audio" | "document" | "embed";
  url: string;
  title: string;
  caption?: string;
  alt?: string;
  credit?: string;
  sourceId?: SourceId;
}

export interface RelatedClaim {
  claimId: ClaimId;
  relationship: "supports" | "contradicts" | "contextualizes" | "depends-on" | "duplicates";
  note?: string;
}
