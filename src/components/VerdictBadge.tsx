import type { Verdict } from "../data/types";
import { verdictLabel } from "../app/formatters";

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  return <span className={`verdict-chip verdict-chip--${verdict}`}>{verdictLabel(verdict)}</span>;
}
