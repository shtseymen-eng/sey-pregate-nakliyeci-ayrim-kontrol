import { COLUMN_ALIASES, REQUIRED_FIELDS } from "@/config/column-aliases";
import type {
  MappingSuggestion,
  SemanticField,
} from "@/types/import";
import { normalizeForComparison } from "@/utils/text";

function normalizeHeader(value: unknown): string {
  return normalizeForComparison(value).replace(/[^a-z0-9 ]/g, "");
}

function scoreHeader(header: string, alias: string): number {
  if (!header || !alias) return 0;
  if (header === alias) return 1;
  if (header.startsWith(alias) || alias.startsWith(header)) return 0.82;
  if (header.includes(alias) || alias.includes(header)) return 0.7;
  return 0;
}

export function suggestColumnMapping(headers: string[]): MappingSuggestion {
  const normalizedHeaders = headers.map(normalizeHeader);
  const mapping: Partial<Record<SemanticField, number>> = {};
  const confidence: Partial<Record<SemanticField, number>> = {};
  const claimed = new Set<number>();

  for (const field of Object.keys(COLUMN_ALIASES) as SemanticField[]) {
    let bestIndex = -1;
    let bestScore = 0;
    for (let index = 0; index < normalizedHeaders.length; index += 1) {
      if (claimed.has(index)) continue;
      const score = Math.max(
        ...COLUMN_ALIASES[field].map((alias) =>
          scoreHeader(normalizedHeaders[index], normalizeHeader(alias)),
        ),
      );
      if (score > bestScore) {
        bestIndex = index;
        bestScore = score;
      }
    }
    if (bestIndex >= 0 && bestScore >= 0.7) {
      mapping[field] = bestIndex;
      confidence[field] = bestScore;
      claimed.add(bestIndex);
    }
  }

  const missingFields = REQUIRED_FIELDS.filter(
    (field) => mapping[field] === undefined,
  );
  return {
    mapping,
    confidence,
    missingFields,
    requiresUserMapping: missingFields.length > 0,
  };
}
