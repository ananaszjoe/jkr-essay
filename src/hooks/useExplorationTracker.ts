import { useCallback, useState } from "react";
import {
  addStoredClaimId,
  explorationPercentage,
  GLANCED_STORAGE_KEY,
  readStoredClaimIds,
  READ_STORAGE_KEY
} from "../tracking/storage";

export function useExplorationTracker() {
  const [glancedClaimIds, setGlancedClaimIds] = useState<Set<string>>(() => readStoredClaimIds(GLANCED_STORAGE_KEY));
  const [readClaimIds, setReadClaimIds] = useState<Set<string>>(() => readStoredClaimIds(READ_STORAGE_KEY));

  const markClaimGlanced = useCallback((claimId: string) => {
    setGlancedClaimIds((current) => addStoredClaimId(current, claimId, GLANCED_STORAGE_KEY));
  }, []);

  const markClaimRead = useCallback((claimId: string) => {
    setReadClaimIds((current) => addStoredClaimId(current, claimId, READ_STORAGE_KEY));
  }, []);

  return {
    glancedPercentage: explorationPercentage(glancedClaimIds.size),
    readPercentage: explorationPercentage(readClaimIds.size),
    showStats: glancedClaimIds.size > 0 || readClaimIds.size > 0,
    markClaimGlanced,
    markClaimRead
  };
}
