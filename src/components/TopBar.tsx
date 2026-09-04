import type { Claim } from "../data/types";

type TopBarProps = {
  className?: string;
  glancedPercentage: string;
  readPercentage: string;
  showStats: boolean;
  query: string;
  searchResults: Claim[];
  onQueryChange: (query: string) => void;
  onOpenClaim: (claim: Claim) => void;
  onOpenAbout: () => void;
};

export function TopBar({
  className,
  glancedPercentage,
  readPercentage,
  showStats,
  query,
  searchResults,
  onQueryChange,
  onOpenClaim,
  onOpenAbout
}: TopBarProps) {
  return (
    <header className={["topbar", className].filter(Boolean).join(" ")}>
      {showStats && (
        <div
          className="exploration-stats"
          aria-label={`${glancedPercentage} of claims glanced over, ${readPercentage} of claims read through`}
        >
          <span>glanced over: <strong>{glancedPercentage}</strong></span>
          <span>read through: <strong>{readPercentage}</strong></span>
        </div>
      )}
      <div className="search-wrap">
        <label htmlFor="claim-search">Search all claims</label>
        <input
          id="claim-search"
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search 247 claims…"
          autoComplete="off"
        />
        {query.trim().length >= 2 && (
          <div className="search-results" role="listbox" aria-label="Matching claims">
            {searchResults.length ? searchResults.map((claim) => (
              <button key={claim.id} type="button" onClick={() => onOpenClaim(claim)} role="option">
                <span>{String(claim.number).padStart(3, "0")}</span>
                {claim.statement}
              </button>
            )) : <p>No matching claims</p>}
          </div>
        )}
      </div>
      <button className="about-button" type="button" onClick={onOpenAbout}>About</button>
    </header>
  );
}
