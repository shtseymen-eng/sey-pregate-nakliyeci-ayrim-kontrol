import { ROOT_CAUSE_RULES } from "@/config/root-cause-rules";
import type { RootCauseMatch } from "@/types/import";
import { cleanDisplayText, normalizeForComparison } from "@/utils/text";

export function splitAndNormalizeRootCauses(value: string): RootCauseMatch[] {
  return value
    .split(/[;\n\r•]+/)
    .map(cleanDisplayText)
    .filter(Boolean)
    .map((original) => {
      const normalized = normalizeForComparison(original);
      const rule = ROOT_CAUSE_RULES.find((candidate) =>
        candidate.patterns.some((pattern) =>
          normalized.includes(normalizeForComparison(pattern)),
        ),
      );
      if (!rule) {
        return {
          id: "unmatched",
          label: original,
          original,
          matched: false,
        };
      }
      return {
        id: rule.id,
        label: rule.label,
        original,
        matched: true,
      };
    });
}
