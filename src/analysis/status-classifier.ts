import {
  DEFAULT_STATUS_RULES,
  EXCLUDED_STATUS_PATTERNS,
  NOT_RED_STATUS_PATTERNS,
  RED_STATUS_PATTERNS,
} from "@/config/status-rules";
import type {
  NormalizedRecord,
  StatusDisposition,
  StatusRuleMap,
  UnknownStatus,
} from "@/types/import";
import { normalizeForComparison } from "@/utils/text";

export function resolveStatusRule(
  status: string,
  userRules: StatusRuleMap,
): StatusDisposition | undefined {
  const normalized = normalizeForComparison(status);
  return userRules[normalized] ?? DEFAULT_STATUS_RULES[normalized];
}

export function classifyRecord(
  record: NormalizedRecord,
  userRules: StatusRuleMap,
): StatusDisposition | "unknown" {
  const normalized = normalizeForComparison(record.status);
  const userRule = userRules[normalized];
  if (userRule) return userRule;

  const exactRule = DEFAULT_STATUS_RULES[normalized];
  if (exactRule) return exactRule;

  if (NOT_RED_STATUS_PATTERNS.some((pattern) => normalized.includes(pattern))) {
    return "not-red";
  }
  if (EXCLUDED_STATUS_PATTERNS.some((pattern) => normalized.includes(pattern))) {
    return "exclude";
  }

  const normalizedReason = normalizeForComparison(record.rejectionReason);
  if (
    normalizedReason
    && EXCLUDED_STATUS_PATTERNS.some((pattern) => normalizedReason.includes(pattern))
  ) {
    return "exclude";
  }
  if (normalizedReason) return "red";
  if (!normalized) return "not-red";
  if (RED_STATUS_PATTERNS.some((pattern) => normalized.includes(pattern))) {
    return "red";
  }
  return "unknown";
}

export function collectUnknownStatuses(
  records: NormalizedRecord[],
  userRules: StatusRuleMap,
): UnknownStatus[] {
  const values = new Map<string, UnknownStatus>();
  for (const record of records) {
    const normalized = normalizeForComparison(record.status);
    if (!normalized || classifyRecord(record, userRules) !== "unknown") continue;
    const existing = values.get(normalized);
    if (existing) existing.count += 1;
    else {
      values.set(normalized, {
        normalized,
        label: record.status.trim(),
        count: 1,
      });
    }
  }
  return [...values.values()];
}
