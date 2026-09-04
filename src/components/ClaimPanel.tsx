import { useRef, useState } from "react";
import { essayIndex, sources, taxonomy } from "../app/data";
import { urlForNode } from "../app/routing";
import type { Claim, EssayIndex } from "../data/types";
import { useReadingProgress } from "../hooks/useReadingProgress";
import { CopyIcon, ShareIcon } from "./Icons";
import { ReadingProgress } from "./ReadingProgress";
import { SourceCard } from "./SourceCard";
import { VerdictBadge } from "./VerdictBadge";

export function ClaimPanel({
  claim,
  onClose,
  onGlanced,
  onRead
}: {
  claim: Claim;
  onClose: () => void;
  onGlanced: (claimId: string) => void;
  onRead: (claimId: string) => void;
}) {
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareInputRef = useRef<HTMLInputElement>(null);
  const section = taxonomy.sections.find((candidate) => candidate.id === claim.sectionId);
  const theme = taxonomy.themes.find((candidate) => candidate.id === section?.themeId);
  const shareUrl = urlForNode(claim.id);
  const paragraphs = claim.reference.paragraphIds
    .map((id) => essayIndex.paragraphs.find((paragraph) => paragraph.id === id))
    .filter((paragraph): paragraph is EssayIndex["paragraphs"][number] => Boolean(paragraph));
  const evidence = claim.factCheck?.evidence?.map((item) => ({
    ...item,
    source: sources.find((source) => source.id === item.sourceId)
  })) ?? [];
  const characterCount = [
    claim.statement,
    theme?.title,
    section?.title,
    ...paragraphs.map((paragraph) => paragraph.summary),
    claim.factCheck?.summary
  ].filter(Boolean).join(" ").length;
  const readingProgress = useReadingProgress({ claimId: claim.id, characterCount, onGlanced, onRead });

  const copyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      shareInputRef.current?.select();
      document.execCommand("copy");
    }
    setCopied(true);
  };

  return (
    <aside className="claim-panel" aria-label={`Claim ${claim.number} details`}>
      <ReadingProgress {...readingProgress} visible={readingProgress.isVisible} />
      <div className="panel-grab" aria-hidden="true" />
      <div className="panel-heading">
        <span>Claim {String(claim.number).padStart(3, "0")}</span>
        <div className="panel-actions">
          <button
            type="button"
            onClick={() => {
              setShowShare((visible) => !visible);
              setCopied(false);
            }}
            aria-label="Share this claim"
            aria-expanded={showShare}
          >
            <ShareIcon />
          </button>
          <button type="button" onClick={onClose} aria-label="Close claim details">×</button>
        </div>
      </div>
      {showShare && (
        <div className="share-box">
          <label htmlFor={`share-url-${claim.id}`}>Share this claim</label>
          <div className="share-field">
            <input
              ref={shareInputRef}
              id={`share-url-${claim.id}`}
              type="text"
              value={shareUrl}
              readOnly
              onFocus={(event) => event.currentTarget.select()}
            />
            <button type="button" onClick={copyShareUrl} aria-live="polite">
              <CopyIcon />
              {copied ? "Copied" : "Copy URL"}
            </button>
          </div>
        </div>
      )}
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
            {claim.factCheck.verdict ? (
              <VerdictBadge verdict={claim.factCheck.verdict} />
            ) : (
              <span className="status-pill">{claim.factCheck.status}</span>
            )}
            {claim.factCheck.summary && <p>{claim.factCheck.summary}</p>}
            {claim.factCheck.analysis && <p>{claim.factCheck.analysis}</p>}
            {claim.factCheck.limitations && (
              <div className="limitations">
                <h3>Limitations</h3>
                <p>{claim.factCheck.limitations}</p>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <span>Pending research</span>
            <p>Evidence, analysis and a verdict will appear here as this project develops.</p>
          </div>
        )}
      </section>

      {evidence.length > 0 && (
        <section>
          <h2>Sources</h2>
          <div className="source-list">
            {evidence.map((item, index) => (
              <SourceCard key={`${item.sourceId}-${index}`} evidence={item} source={item.source} index={index} />
            ))}
          </div>
        </section>
      )}
    </aside>
  );
}
