export function AboutDialog({ onClose }: { onClose: () => void }) {
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
