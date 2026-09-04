import { useEffect, useState } from "react";

const CHARACTERS_PER_SECOND = 20;
const GLANCE_THRESHOLD_MS = 1000;
const READING_THRESHOLD_MS = 3000;

export function useReadingProgress({
  claimId,
  characterCount,
  onGlanced,
  onRead
}: {
  claimId: string;
  characterCount: number;
  onGlanced: (claimId: string) => void;
  onRead: (claimId: string) => void;
}) {
  const [activeTimeMs, setActiveTimeMs] = useState(0);
  const estimatedReadingTimeMs = Math.max(3000, (characterCount / CHARACTERS_PER_SECOND) * 1000);
  const completedAtMs = GLANCE_THRESHOLD_MS + estimatedReadingTimeMs;
  const challengeLabelStartsAtMs = READING_THRESHOLD_MS + ((completedAtMs - READING_THRESHOLD_MS) / 2);
  const progress = Math.min(100, Math.max(0, ((activeTimeMs - GLANCE_THRESHOLD_MS) / estimatedReadingTimeMs) * 100));
  const isGlanced = activeTimeMs >= GLANCE_THRESHOLD_MS;
  const isComplete = activeTimeMs >= completedAtMs;
  const label = isComplete
    ? "You've likely read it"
    : activeTimeMs >= challengeLabelStartsAtMs
      ? "You're reading it… Right?"
      : activeTimeMs >= READING_THRESHOLD_MS
        ? "You're reading it"
        : "You glanced over";

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        setActiveTimeMs((current) => Math.min(completedAtMs, current + 100));
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [completedAtMs]);

  useEffect(() => {
    if (isGlanced) onGlanced(claimId);
  }, [claimId, isGlanced, onGlanced]);

  useEffect(() => {
    if (isComplete) onRead(claimId);
  }, [claimId, isComplete, onRead]);

  return { isVisible: isGlanced, label, progress };
}
