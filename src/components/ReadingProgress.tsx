export function ReadingProgress({
  progress,
  label,
  visible = true
}: {
  progress: number;
  label: string;
  visible?: boolean;
}) {
  return (
    <div className={`reading-progress ${visible ? "is-visible" : ""}`}>
      <div
        className="reading-progress__bar"
        role="progressbar"
        aria-label="Estimated reading progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
      >
        <span style={{ width: `${progress}%` }} />
      </div>
      <span className="reading-progress__label">{label}</span>
    </div>
  );
}
