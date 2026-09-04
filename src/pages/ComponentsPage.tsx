import type { ReactNode } from "react";
import type { Claim, Evidence, Source, Verdict } from "../data/types";
import { StaticGraphCard as GraphCardSpecimen, type GraphNodeData } from "../components/GraphCard";
import { CopyIcon, ShareIcon } from "../components/Icons";
import { ReadingProgress } from "../components/ReadingProgress";
import { SourceCard } from "../components/SourceCard";
import { TopBar } from "../components/TopBar";
import { VerdictBadge } from "../components/VerdictBadge";

const exampleEvidence: Evidence = {
  sourceId: "example-source",
  stance: "supports",
  locator: "Results, table 2",
  note: "An example evidence note explains precisely what this source establishes."
};

const exampleSource: Source = {
  id: "example-source",
  title: "Example primary source",
  authors: ["A. Researcher"],
  publisher: "Example Publisher",
  publishedOn: "2020-01-01",
  accessedOn: "2020-01-01",
  url: "#components",
  type: "primary-document"
};

const exampleSearchClaims: Claim[] = [
  "Evidence can support a narrow attribution.",
  "Evidence may contextualize a numerical claim.",
  "Evidence can contradict the stated conclusion."
].map((statement, index) => ({
  id: `example-claim-${index + 1}`,
  number: index + 1,
  statement,
  sectionId: "example-section",
  reference: { paragraphIds: ["p001"] }
}));

export function ComponentsPage() {
  const verdicts: Verdict[] = [
    "supported",
    "mostly-supported",
    "mixed",
    "misleading-context",
    "mostly-unsupported",
    "unsupported",
    "unverifiable"
  ];

  return (
    <main className="components-page">
      <TopBar
        className="components-topbar"
        glancedPercentage="42.1%"
        readPercentage="18.6%"
        showStats
        query="evidence"
        searchResults={exampleSearchClaims}
        onQueryChange={() => undefined}
        onOpenClaim={() => undefined}
        onOpenAbout={() => undefined}
      />

      <div className="components-page__content">
        <header className="components-intro">
          <span className="kicker">Visual reference · #components</span>
          <h1>Component inventory</h1>
          <p>Static specimens for design scrutiny and future visual-regression testing.</p>
        </header>

        <ComponentSection title="Graph nodes">
          <div className="component-grid component-grid--nodes">
            <StaticGraphCard kind="essay" eyebrow="June 2020 essay" title="Example essay root node" meta="247 extracted claims" />
            <StaticGraphCard kind="theme" eyebrow="Theme 01" title="Example thematic category" meta="4 sections · 38 claims" />
            <StaticGraphCard kind="section" eyebrow="Section 01" title="Example section category" meta="12 claims · expand" />
            <StaticGraphCard kind="claim" eyebrow="Claim 001" title="Example supported claim shown as an end leaf." meta="open details" verdict="supported" />
          </div>
        </ComponentSection>

        <ComponentSection title="Fact-check verdicts">
          <div className="component-row component-row--wrap">
            {verdicts.map((verdict) => (
              <VerdictBadge key={verdict} verdict={verdict} />
            ))}
            <span className="status-pill">Pending research</span>
          </div>
        </ComponentSection>

        <ComponentSection title="Reading progress">
          <div className="progress-specimens">
            {[
              { width: 8, label: "You glanced over" },
              { width: 35, label: "You're reading it" },
              { width: 70, label: "You're reading it… Right?" },
              { width: 100, label: "You've likely read it" }
            ].map((state) => (
              <div className="progress-specimen" key={state.label}>
                <div className="reading-progress__bar"><span style={{ width: `${state.width}%` }} /></div>
                <span>{state.label}</span>
              </div>
            ))}
          </div>
        </ComponentSection>

        <ComponentSection title="Claim detail panel">
          <aside className="claim-panel component-panel" aria-label="Example claim detail panel">
            <ReadingProgress progress={64} label="You're reading it… Right?" />
            <div className="panel-heading">
              <span>Claim 001</span>
              <div className="panel-actions">
                <button type="button" aria-label="Share this example"><ShareIcon /></button>
                <button type="button" aria-label="Close example">×</button>
              </div>
            </div>
            <div className="share-box">
              <label htmlFor="component-share-url">Share this claim</label>
              <div className="share-field">
                <input id="component-share-url" value="https://example.test/#claim-001" readOnly />
                <button type="button"><CopyIcon />Copy URL</button>
              </div>
            </div>
            <h1>An example claim title that demonstrates the panel’s editorial hierarchy.</h1>
            <p className="panel-section">Example theme / Example section</p>
            <section>
              <h2>In the essay</h2>
              <article className="reference-card">
                <strong>P001</strong>
                <p>A concise example summary showing how the essay reference is presented.</p>
              </article>
              <a href="#components">Read the original essay ↗</a>
            </section>
            <section>
              <h2>Fact-check</h2>
              <VerdictBadge verdict="supported" />
              <p>This example summary demonstrates the primary result text and its spacing.</p>
              <p>This longer example analysis illustrates how explanatory copy flows within the panel without relying on production content.</p>
              <div className="limitations">
                <h3>Limitations</h3>
                <p>An example limitation clarifies the scope of the available evidence.</p>
              </div>
            </section>
            <section>
              <h2>Sources</h2>
              <div className="source-list">
                <SourceCard evidence={exampleEvidence} source={exampleSource} index={0} />
              </div>
            </section>
          </aside>
        </ComponentSection>

        <ComponentSection title="Utility and empty states">
          <div className="component-row component-row--utilities">
            <div className="graph-hint"><span aria-hidden="true">↔</span>Pan · zoom · arrow keys navigate</div>
            <button className="take-me-back" type="button">Take me back</button>
            <div className="empty-state"><span>Pending research</span><p>Evidence, analysis and a verdict will appear here as this project develops.</p></div>
          </div>
        </ComponentSection>

        <ComponentSection title="About dialog">
          <section className="about-dialog component-about" aria-label="Example about dialog">
            <button type="button" className="dialog-close" aria-label="Close example dialog">×</button>
            <span className="kicker">About this project</span>
            <h1>One essay. Many separable claims.</h1>
            <p>Example explanatory copy for the project information dialog.</p>
          </section>
        </ComponentSection>
      </div>
    </main>
  );
}

function ComponentSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="component-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function StaticGraphCard({
  kind,
  eyebrow,
  title,
  meta,
  verdict
}: {
  kind: GraphNodeData["kind"];
  eyebrow: string;
  title: string;
  meta: string;
  verdict?: Verdict;
}) {
  return <GraphCardSpecimen data={{ kind, eyebrow, title, meta, verdict }} />;
}
