import { formatSourceByline } from "../app/formatters";
import type { Evidence, Source } from "../data/types";

export function SourceCard({ evidence, source, index }: { evidence: Evidence; source?: Source; index: number }) {
  return (
    <article className="source-card">
      <div className="source-card__heading">
        <span className={`evidence-stance evidence-stance--${evidence.stance}`}>{evidence.stance}</span>
        <span>{String(index + 1).padStart(2, "0")}</span>
      </div>
      {source ? (
        <>
          <a href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a>
          <p className="source-byline">{formatSourceByline(source)}</p>
        </>
      ) : (
        <strong>{evidence.sourceId}</strong>
      )}
      {evidence.locator && <p className="source-locator">{evidence.locator}</p>}
      <p className="source-note">{evidence.note}</p>
    </article>
  );
}
