import { claims } from "../app/data";

export const GLANCED_STORAGE_KEY = "jkr-exploration-glanced";
export const READ_STORAGE_KEY = "jkr-exploration-read";

export function readStoredClaimIds(key: string): Set<string> {
  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    if (!Array.isArray(stored)) return new Set();
    return new Set(stored.filter((id): id is string => typeof id === "string"));
  } catch {
    return new Set();
  }
}

export function addStoredClaimId(current: Set<string>, claimId: string, key: string): Set<string> {
  if (current.has(claimId)) return current;
  const next = new Set(current).add(claimId);
  try {
    window.localStorage.setItem(key, JSON.stringify([...next]));
  } catch {
    // Tracking still works for this page load when browser storage is unavailable.
  }
  return next;
}

export function explorationPercentage(count: number): string {
  const percentage = Math.min(100, (count / claims.length) * 100);
  if (percentage === 0 || percentage === 100) return `${percentage.toFixed(0)}%`;
  return `${percentage.toFixed(1)}%`;
}
