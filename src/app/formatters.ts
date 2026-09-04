import type { Source, Verdict } from "../data/types";

export function verdictLabel(verdict: Verdict): string {
  return {
    supported: "Supported",
    "mostly-supported": "Mostly supported",
    mixed: "Mixed",
    "mostly-unsupported": "Mostly false",
    unsupported: "False",
    "misleading-context": "Misleading context",
    unverifiable: "Unverifiable"
  }[verdict];
}

export function formatSourceByline(source: Source): string {
  const parts = [
    source.authors?.join(", "),
    source.publisher,
    source.publishedOn
      ? new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${source.publishedOn}T00:00:00Z`))
      : undefined
  ];
  return parts.filter(Boolean).join(" · ");
}
